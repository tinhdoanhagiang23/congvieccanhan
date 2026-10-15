/* Lớp dữ liệu: đăng nhập Supabase Auth + đọc/ghi 3 bảng tasks, next_week_tasks, config. */
(function (G) {
  "use strict";
  let sb = null;
  const LS = "qlct_conn";
  const TASK_FIELDS = ["title", "mo_ta", "loai", "uu_tien", "ngay_bd", "ngay_kt", "gio_bd", "gio_kt", "dia_diem",
    "nguoi_pt", "trang_thai", "ket_qua", "ghi_chu", "lanh_dao_giao", "thoi_han_vb", "lanh_dao_tham_dinh",
    "chu_tri", "phoi_hop", "loai_viec_bc", "tu_danh_gia_cl", "truc", "nhom_ab", "can_cu_nv",
    "so_luong_ke_hoach", "nhom_kho", "so_luong_thuc_te", "he_so_chat_luong"];

  function conn() {
    const c = G.APP_CONFIG || {};
    if (c.SUPABASE_URL && c.SUPABASE_ANON_KEY) return { url: c.SUPABASE_URL.trim(), key: c.SUPABASE_ANON_KEY.trim() };
    try { const s = JSON.parse(localStorage.getItem(LS) || "null"); if (s && s.url && s.key) return s; } catch (e) { /* bỏ qua */ }
    return null;
  }
  function saveConn(url, key) { try { localStorage.setItem(LS, JSON.stringify({ url: url.trim(), key: key.trim() })); } catch (e) { /* bỏ qua */ } }
  function clearConn() { try { localStorage.removeItem(LS); } catch (e) { /* bỏ qua */ } }

  function init() {
    const c = conn();
    if (!c) return false;
    sb = G.supabase.createClient(c.url, c.key, { auth: { persistSession: true, autoRefreshToken: true } });
    return true;
  }
  const must = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };

  const Auth = {
    async session() { const { data } = await sb.auth.getSession(); return data.session; },
    async signIn(email, password) { must(await sb.auth.signInWithPassword({ email, password })); },
    async signOut() { await sb.auth.signOut(); },
    async changePassword(pw) { must(await sb.auth.updateUser({ password: pw })); },
    onChange(fn) { sb.auth.onAuthStateChange((_e, s) => fn(s)); },
  };

  function clean(data) {
    const o = {};
    for (const k of TASK_FIELDS) if (k in data) o[k] = data[k] === "" ? null : data[k];
    return o;
  }

  const Tasks = {
    async all() {
      const out = [];
      for (let from = 0; ; from += 1000) {
        const rows = must(await sb.from("tasks").select("*").order("ngay_bd", { ascending: true }).order("id").range(from, from + 999));
        out.push(...rows);
        if (rows.length < 1000) break;
      }
      return out;
    },
    async insert(d) { return must(await sb.from("tasks").insert(clean(d)).select().single()); },
    async update(id, d) { return must(await sb.from("tasks").update(clean(d)).eq("id", id).select().single()); },
    async remove(id) { must(await sb.from("tasks").delete().eq("id", id)); },
  };

  const Nwt = {
    async query(tuan, nam) {
      return must(await sb.from("next_week_tasks").select("*").eq("tuan", tuan).eq("nam", nam).order("id"));
    },
    async insert(d) {
      return must(await sb.from("next_week_tasks").insert({
        noi_dung: d.noi_dung, phoi_hop: d.phoi_hop || null, thoi_gian_hoan_thanh: d.thoi_gian_hoan_thanh || null,
        tuan: d.tuan, nam: d.nam }).select().single());
    },
    async update(id, d) {
      return must(await sb.from("next_week_tasks").update({ noi_dung: d.noi_dung, phoi_hop: d.phoi_hop || null,
        thoi_gian_hoan_thanh: d.thoi_gian_hoan_thanh || null }).eq("id", id).select().single());
    },
    async remove(id) { must(await sb.from("next_week_tasks").delete().eq("id", id)); },
    async all() { return must(await sb.from("next_week_tasks").select("*").order("id")); },
  };

  const Config = {
    async all() {
      const rows = must(await sb.from("config").select("*"));
      const o = {}; rows.forEach((r) => { o[r.key] = r.value; });
      return o;
    },
    async set(key, value) { must(await sb.from("config").upsert({ key, value: value ?? "" })); },
    async setMany(obj) {
      const rows = Object.entries(obj).map(([key, value]) => ({ key, value: value ?? "" }));
      if (rows.length) must(await sb.from("config").upsert(rows));
    },
  };

  /** Sao lưu / khôi phục toàn bộ dữ liệu dạng JSON. */
  const Backup = {
    async exportAll() {
      return { app: "QuanLyCongTac", version: 1, exported_at: new Date().toISOString(),
        tasks: await Tasks.all(), next_week_tasks: await Nwt.all(), config: await Config.all() };
    },
    async importAll(obj) {
      if (!obj || obj.app !== "QuanLyCongTac" || !Array.isArray(obj.tasks)) throw new Error("File không phải bản sao lưu của phần mềm.");
      let n = 0;
      for (let i = 0; i < obj.tasks.length; i += 200) {
        const part = obj.tasks.slice(i, i + 200).map((t) => ({ id: t.id, ...clean(t) }));
        must(await sb.from("tasks").upsert(part)); n += part.length;
      }
      const nw = (obj.next_week_tasks || []).map((t) => ({ id: t.id, noi_dung: t.noi_dung, phoi_hop: t.phoi_hop,
        thoi_gian_hoan_thanh: t.thoi_gian_hoan_thanh, tuan: t.tuan, nam: t.nam }));
      if (nw.length) must(await sb.from("next_week_tasks").upsert(nw));
      await Config.setMany(obj.config || {});
      return { tasks: n, nwt: nw.length };
    },
  };

  G.DB = { init, conn, saveConn, clearConn, Auth, Tasks, Nwt, Config, Backup };
})(window);
