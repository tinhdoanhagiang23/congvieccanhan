/* Giao diện chính: đăng nhập, điều hướng, các trang và xuất báo cáo. */
(function () {
  "use strict";
  const C = Core, esc = Charts.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const STATUS_COLOR = { "Hoàn thành": "#1A9651", "Đang thực hiện": "#E67E22", "Chưa thực hiện": "#7D3C98", "Trễ hạn": "#C8102E" };
  const APP = { version: "1.0", year: "2026", dev: { name: "Ngạc Văn Tuấn", role: "Chuyên viên Văn phòng", org: "Ban Tuyên giáo Tỉnh ủy Tuyên Quang", phone: "0946657445", email: "ngacvantuan.hg@gmail.com" } };

  const IC = {
    home: '<path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2"/><circle cx="3.5" cy="12" r="1.2"/><circle cx="3.5" cy="18" r="1.2"/>',
    next: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15h6m-2.5-2.5L15 15l-2.5 2.5"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    dl: '<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16"/>',
    ul: '<path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 20h16"/>',
  };
  const ico = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

  const S = { tasks: [], cfg: {}, page: "dash", filters: { kw: "", ts: "", loai: "", use: false, tu: "", den: "" }, tab: 0, nwtSel: null, ready: false };
  const NAV = [["dash", "Tổng quan", "home"], ["tasks", "Công việc", "list"], ["nwt", "Nhiệm vụ tuần tới", "next"],
    ["reports", "Báo cáo & Xuất file", "file"], ["cbcc", "Đánh giá CBCC", "star", true], ["settings", "Cài đặt", "cog"], ["about", "Giới thiệu", "info"]];

  // ───────────── tiện ích ─────────────
  function toast(msg, err) {
    const t = document.createElement("div"); t.className = "toast" + (err ? " err" : ""); t.textContent = msg;
    $("#toasts").appendChild(t); setTimeout(() => t.remove(), err ? 6000 : 3200);
  }
  const busy = (on) => $("#busy").classList.toggle("hidden", !on);
  async function guard(fn, okMsg) {
    busy(true);
    try { const r = await fn(); if (okMsg) toast(okMsg); return r; }
    catch (e) { console.error(e); toast(vnErr(e), true); }
    finally { busy(false); }
  }
  function vnErr(e) {
    const m = (e && e.message) || String(e);
    if (/Invalid login/i.test(m)) return "Sai email hoặc mật khẩu.";
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "Không kết nối được máy chủ. Kiểm tra mạng hoặc trạng thái Supabase.";
    if (/JWT|permission|row-level|401|403/i.test(m)) return "Không có quyền truy cập dữ liệu — hãy đăng nhập lại.";
    return "Lỗi: " + m;
  }
  function msgDlg(html, buttons) {
    return new Promise((res) => {
      const d = $("#msgDlg");
      d.innerHTML = `<div class="dlg"><div>${html}</div><div class="dlg-foot">${buttons.map((b, i) =>
        `<button class="btn ${b.cls || ""}" data-i="${i}">${b.label}</button>`).join("")}</div></div>`;
      d.onclose = () => res(null);
      d.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) { d.close(); res(buttons[+b.dataset.i].v); } }, { once: true });
      d.showModal();
    });
  }
  const confirmDlg = (html, ok = "Xóa") => msgDlg(html, [{ label: "Hủy", v: false }, { label: ok, cls: "primary", v: true }]).then(Boolean);
  const alertDlg = (html) => msgDlg(html, [{ label: "Đóng", cls: "primary", v: true }]);
  function saveBlob(blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  const safe = (s) => String(s).replace(/[\s/\\:]+/g, "_");
  const pill = (t) => `<span class="pill" style="--c:${STATUS_COLOR[t] || "#6B7280"}">${esc(t)}</span>`;
  const gioStr = (t) => [t.gio_bd || "", t.gio_kt || ""].filter(Boolean).join(" – ") || "Cả ngày";
  const inRange = (tasks, tu, den) => tasks.filter((t) => t.ngay_kt >= tu && t.ngay_bd <= den);
  const orgCfg = () => ({ cap_uy: S.cfg.cap_uy || "", ten_don_vi: S.cfg.ten_don_vi || "", dia_danh: S.cfg.dia_danh || "" });
  const loaiList = () => Array.from(new Set([...C.LOAI_CV, ...S.tasks.map((t) => t.loai).filter(Boolean)]));
  const opts = (arr, cur) => arr.map((a) => `<option${a === cur ? " selected" : ""}>${esc(a)}</option>`).join("");

  // ───────────── khởi động / đăng nhập ─────────────
  function show(id) { ["setup", "login", "app"].forEach((x) => $("#" + x).classList.toggle("hidden", x !== id)); }

  async function enterApp() {
    busy(true);
    try {
      const [tasks, cfg] = await Promise.all([DB.Tasks.all(), DB.Config.all()]);
      S.tasks = tasks; S.cfg = cfg; S.ready = true;
      show("app"); buildShell(); go(S.page);
      if (!cfg.ten) { toast("Hãy nhập họ tên của bạn ở mục Cài đặt."); go("settings"); }
    } catch (e) { console.error(e); show("login"); $("#lgErr").textContent = vnErr(e); }
    finally { busy(false); }
  }

  function boot() {
    if (!DB.init()) { show("setup"); return; }
    DB.Auth.onChange((s) => { if (!s && S.ready) { S.ready = false; show("login"); } });
    DB.Auth.session().then((s) => (s ? enterApp() : show("login"))).catch(() => show("login"));
  }

  $("#setupForm").addEventListener("submit", (e) => {
    e.preventDefault(); DB.saveConn($("#setUrl").value, $("#setKey").value); boot();
  });
  $("#resetConn").addEventListener("click", (e) => { e.preventDefault(); DB.clearConn(); location.reload(); });
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); $("#lgErr").textContent = ""; $("#lgBtn").disabled = true;
    try { await DB.Auth.signIn($("#lgEmail").value.trim(), $("#lgPass").value); $("#lgPass").value = ""; await enterApp(); }
    catch (er) { $("#lgErr").textContent = vnErr(er); }
    finally { $("#lgBtn").disabled = false; }
  });

  function buildShell() {
    $("#menuBtn").innerHTML = ico("menu"); $("#logoutBtn").innerHTML = ico("out");
    $("#nav").innerHTML = NAV.map(([id, l, ic, soon]) =>
      `<button data-p="${id}" class="${soon ? "soon" : ""}">${ico(ic)}<span>${l.replace("&", "&amp;")}</span>${soon ? "<em>Sắp có</em>" : ""}</button>`).join("");
    refreshUser();
  }
  function refreshUser() {
    const n = S.cfg.ten || "Chưa nhập tên";
    $("#uName").textContent = n; $("#uRole").textContent = S.cfg.chuc_vu || "Chuyên viên";
    $("#uAvatar").textContent = n.trim().split(/\s+/).pop().charAt(0).toUpperCase();
  }
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-p]"); if (!b) return;
    if (b.classList.contains("soon")) { toast("Mục Đánh giá cán bộ, công chức sẽ được bổ sung ở bản sau."); return; }
    go(b.dataset.p); closeMenu();
  });
  const closeMenu = () => { $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("show"); };
  $("#menuBtn").addEventListener("click", () => { $("#sidebar").classList.add("open"); $("#scrim").classList.add("show"); });
  $("#scrim").addEventListener("click", closeMenu);
  $("#logoutBtn").addEventListener("click", async () => {
    if (await confirmDlg("Đăng xuất khỏi thiết bị này?", "Đăng xuất")) { await DB.Auth.signOut(); S.ready = false; show("login"); }
  });

  function go(p) {
    S.page = p;
    $$("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.p === p));
    const nav = NAV.find((n) => n[0] === p); $("#tbTitle").textContent = nav ? nav[1] : "";
    const R = { dash: pageDash, tasks: pageTasks, nwt: pageNwt, reports: pageReports, settings: pageSettings, about: pageAbout }[p];
    $("#content").innerHTML = ""; window.scrollTo(0, 0);
    if (R) R($("#content"));
  }

  const head = (t, sub, right) => `<div class="page-head"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${right || ""}</div>`;
  const stat = (l, v, c, s) => `<div class="card stat" style="--c:${c}"><small>${l}</small><strong>${v}</strong><span>${s || "&nbsp;"}</span></div>`;

  // ───────────── TỔNG QUAN ─────────────
  function pageDash(root) {
    const t0 = C.today(), tasks = S.tasks, tong = tasks.length;
    const cnt = {}; tasks.forEach((t) => { cnt[t.trang_thai] = (cnt[t.trang_thai] || 0) + 1; });
    const ht = cnt["Hoàn thành"] || 0, pt = tong ? Math.round((ht / tong) * 100) : 0;
    const y = t0.getFullYear(), tot = [], done = [];
    for (let m = 1; m <= 12; m++) {
      const mt = inRange(tasks, `${y}-${C.pad(m)}-01`, `${y}-${C.pad(m)}-${C.pad(C.lastDay(y, m))}`);
      tot.push(mt.length); done.push(mt.filter((t) => t.trang_thai === "Hoàn thành").length);
    }
    const cats = [], tw = [], dw = [];
    for (let w = 7; w >= 0; w--) {
      const mon = C.addDays(C.mondayOf(t0), -7 * w), wt = inRange(tasks, C.iso(mon), C.iso(C.addDays(mon, 6)));
      cats.push("T" + C.isoWeek(mon)[0]); tw.push(wt.length); dw.push(wt.filter((t) => t.trang_thai === "Hoàn thành").length);
    }
    const loai = {}; tasks.forEach((t) => { const k = t.loai || "Khác"; loai[k] = (loai[k] || 0) + 1; });
    const ds = C.iso(t0), today = tasks.filter((t) => t.ngay_bd <= ds && t.ngay_kt >= ds);
    root.innerHTML = `
      <div class="page-head"><div><h1>Xin chào, ${esc(S.cfg.ten || "bạn")}!</h1>
        <p>${C.VN_THU[C.weekday(t0)]}, ngày ${t0.getDate()} tháng ${t0.getMonth() + 1} năm ${t0.getFullYear()}</p></div>
        <button class="btn primary" id="dAdd">${ico("plus")} Thêm công việc</button></div>
      <div class="grid g5">
        ${stat("TỔNG CÔNG VIỆC", tong, "#2A5298", "toàn bộ")}${stat("HOÀN THÀNH", ht, "#1A9651", pt + "% tổng số")}
        ${stat("ĐANG THỰC HIỆN", cnt["Đang thực hiện"] || 0, "#E67E22")}${stat("CHƯA THỰC HIỆN", cnt["Chưa thực hiện"] || 0, "#7D3C98")}
        ${stat("TRỄ HẠN", cnt["Trễ hạn"] || 0, "#C8102E", cnt["Trễ hạn"] ? "cần xử lý" : "")}</div>
      <div class="grid g-12" style="margin-top:14px">
        <div class="card"><h3>Trạng thái công việc</h3>${Charts.donut(C.TRANG_THAI.map((k) => [k, cnt[k] || 0, STATUS_COLOR[k]]))}</div>
        <div class="card"><h3>Tiến độ theo tháng — ${y}</h3>${Charts.bars(Array.from({ length: 12 }, (_, i) => "T" + (i + 1)), [["Tổng", "#2A5298", tot], ["Hoàn thành", "#1A9651", done]])}</div></div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>Phân loại công việc</h3>${Charts.hbars(Object.entries(loai), "#C8102E")}</div>
        <div class="card"><h3>Xu hướng 8 tuần gần nhất</h3>${Charts.line(cats, [["Tổng", "#2A5298", tw], ["Hoàn thành", "#1A9651", dw]])}</div></div>
      <div class="section-label">Công việc hôm nay</div>
      <div class="card">${today.length ? today.map((t) => `<div class="today-item"><div class="tm">${esc(gioStr(t))}</div><div class="tt">${esc(t.title)}</div>${pill(t.trang_thai)}</div>`).join("")
        : '<p class="muted" style="margin:0">Không có công việc nào hôm nay.</p>'}</div>`;
    $("#dAdd").onclick = () => taskDialog();
  }

  // ───────────── CÔNG VIỆC ─────────────
  function pageTasks(root) {
    const f = S.filters;
    root.innerHTML = head("Lịch & Quản lý công việc", "Thêm, sửa, theo dõi toàn bộ công việc của bạn.", `<button class="btn primary" id="tAdd">${ico("plus")} Thêm công việc</button>`) + `
      <div class="card flat filters">
        <input id="fKw" placeholder="Tìm theo tiêu đề, địa điểm…" value="${esc(f.kw)}">
        <select id="fTs"><option value="">Tất cả trạng thái</option>${opts(C.TRANG_THAI, f.ts)}</select>
        <select id="fLoai"><option value="">Tất cả loại</option>${opts(loaiList(), f.loai)}</select>
        <label class="f row"><input type="checkbox" id="fUse"${f.use ? " checked" : ""}> Lọc ngày</label>
        <input type="date" id="fTu" value="${f.tu}"><input type="date" id="fDen" value="${f.den}">
      </div>
      <div class="table-wrap cardwrap"><table class="tbl cards"><thead><tr><th>Ngày</th><th>Giờ</th><th>Công việc</th><th>Loại</th><th>Trạng thái</th><th>Địa điểm</th><th></th></tr></thead><tbody id="tBody"></tbody></table></div>
      <p class="hint" id="tCount" style="margin-top:10px"></p>`;
    if (!f.tu) { f.tu = C.iso(new Date(C.today().getFullYear(), C.today().getMonth(), 1)); f.den = C.iso(C.today()); $("#fTu").value = f.tu; $("#fDen").value = f.den; }
    $("#tAdd").onclick = () => taskDialog();
    const upd = () => { f.kw = $("#fKw").value; f.ts = $("#fTs").value; f.loai = $("#fLoai").value; f.use = $("#fUse").checked; f.tu = $("#fTu").value; f.den = $("#fDen").value; drawTasks(); };
    ["fKw", "fTs", "fLoai", "fUse", "fTu", "fDen"].forEach((id) => $("#" + id).addEventListener(id === "fKw" ? "input" : "change", upd));
    $("#tBody").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const id = +b.dataset.id, t = S.tasks.find((x) => x.id === id); if (!t) return;
      if (b.dataset.a === "edit") taskDialog(t);
      if (b.dataset.a === "done") {
        const r = await guard(() => DB.Tasks.update(id, { trang_thai: "Hoàn thành" }), "Đã đánh dấu hoàn thành.");
        if (r) { Object.assign(t, r); drawTasks(); }
      }
      if (b.dataset.a === "del" && await confirmDlg(`Xóa công việc <b>${esc(t.title)}</b>?<br><span class="muted">Không thể hoàn tác.</span>`)) {
        const ok = await guard(async () => { await DB.Tasks.remove(id); return true; }, "Đã xóa công việc.");
        if (ok) { S.tasks = S.tasks.filter((x) => x.id !== id); drawTasks(); }
      }
    });
    drawTasks();
  }
  function drawTasks() {
    const f = S.filters; let rows = S.tasks.slice();
    if (f.use && f.tu && f.den) rows = inRange(rows, f.tu, f.den);
    const kw = f.kw.trim().toLowerCase();
    if (kw) rows = rows.filter((t) => t.title.toLowerCase().includes(kw) || (t.dia_diem || "").toLowerCase().includes(kw));
    if (f.ts) rows = rows.filter((t) => t.trang_thai === f.ts);
    if (f.loai) rows = rows.filter((t) => t.loai === f.loai);
    rows.sort((a, b) => (b.ngay_bd + (b.gio_bd || "")).localeCompare(a.ngay_bd + (a.gio_bd || "")) || b.id - a.id);
    $("#tBody").innerHTML = rows.length ? rows.map((t) => {
      const d1 = C.fmtD(t.ngay_bd), d2 = C.fmtD(t.ngay_kt);
      return `<tr><td data-l="Ngày">${d1 === d2 ? d1 : d1 + " → " + d2}</td><td data-l="Giờ">${esc(gioStr(t))}</td>
        <td class="ttl">${esc(t.title)}</td><td data-l="Loại">${esc(t.loai || "")}</td><td class="st">${pill(t.trang_thai)}</td>
        <td data-l="Địa điểm">${esc(t.dia_diem || "")}</td>
        <td class="act"><div class="tbl-actions">
          ${t.trang_thai !== "Hoàn thành" ? `<button class="icon-btn" title="Đánh dấu hoàn thành" data-a="done" data-id="${t.id}" style="color:#1A9651">${ico("check")}</button>` : ""}
          <button class="icon-btn" title="Sửa" data-a="edit" data-id="${t.id}">${ico("edit")}</button>
          <button class="icon-btn red" title="Xóa" data-a="del" data-id="${t.id}">${ico("trash")}</button></div></td></tr>`;
    }).join("") : `<tr><td colspan="7" class="empty">Không có công việc nào phù hợp.</td></tr>`;
    $("#tCount").textContent = `Tổng: ${rows.length} công việc`;
  }

  // ───────────── HỘP THOẠI THÊM / SỬA ─────────────
  function taskDialog(task) {
    const d = task || {}, t0 = C.iso(C.today()), dlg = $("#taskDlg");
    const v = (x) => esc(x == null ? "" : x);
    dlg.innerHTML = `<form class="dlg" id="tForm" novalidate>
      <h2>${task ? "Sửa công việc" : "Thêm công việc mới"}</h2>
      <div class="form-grid">
        <label class="f span2">Tiêu đề (*)<input id="f_title" value="${v(d.title)}" required maxlength="500"></label>
        <label class="f span2">Loại công việc<select id="f_loai">${opts(loaiList(), d.loai || "Khác")}</select></label>
        <label class="f">Từ ngày<input type="date" id="f_bd" value="${d.ngay_bd || t0}" required></label>
        <label class="f">Đến ngày<input type="date" id="f_kt" value="${d.ngay_kt || d.ngay_bd || t0}" required></label>
        <label class="f">Ưu tiên<select id="f_uu">${opts(C.UU_TIEN, d.uu_tien || "Bình thường")}</select></label>
        <label class="f">Trạng thái<select id="f_ts">${opts(C.TRANG_THAI, d.trang_thai || "Chưa thực hiện")}</select></label>
        <label class="f">Giờ bắt đầu<input type="time" id="f_gbd" value="${v(task ? d.gio_bd : "07:30")}"></label>
        <label class="f">Giờ kết thúc<input type="time" id="f_gkt" value="${v(task ? d.gio_kt : "17:00")}"></label>
        <label class="f">Địa điểm<input id="f_dd" value="${v(d.dia_diem)}"></label>
        <label class="f">Người phụ trách<input id="f_pt" value="${v(d.nguoi_pt)}"></label>
      </div>
      <div class="section-label" style="margin-top:18px">Thông tin cho Mẫu báo cáo CBCC VP (không bắt buộc)</div>
      <div class="form-grid">
        <label class="f">Lãnh đạo giao<input id="f_ldg" value="${v(d.lanh_dao_giao)}"></label>
        <label class="f">Thời hạn yêu cầu hoàn thành<input type="date" id="f_han" value="${v(d.thoi_han_vb)}"></label>
        <label class="f">Lãnh đạo thẩm định, duyệt<input id="f_ldtd" value="${v(d.lanh_dao_tham_dinh)}"></label>
        <label class="f">Phối hợp (nếu có)<input id="f_ph" value="${v(d.phoi_hop)}"></label>
        <label class="f span4">Kết quả thực hiện<input id="f_kq" value="${v(d.ket_qua)}"></label>
        <label class="f span4">Ghi chú<textarea id="f_gc" rows="2">${v(d.ghi_chu)}</textarea></label>
      </div>
      <div class="form-err" id="f_err"></div>
      <div class="dlg-foot"><button type="button" class="btn" id="f_cancel">Hủy</button><button type="submit" class="btn primary" id="f_save">Lưu công việc</button></div>
    </form>`;
    dlg.showModal();
    $("#f_cancel").onclick = () => dlg.close();
    $("#f_bd").addEventListener("change", () => { if ($("#f_kt").value < $("#f_bd").value) $("#f_kt").value = $("#f_bd").value; });
    $("#tForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = $("#f_title").value.trim(), bd = $("#f_bd").value, kt = $("#f_kt").value;
      if (!title) return ($("#f_err").textContent = "Vui lòng nhập tiêu đề!");
      if (!bd || !kt) return ($("#f_err").textContent = "Vui lòng chọn ngày bắt đầu và kết thúc.");
      if (kt < bd) return ($("#f_err").textContent = "Ngày kết thúc không được trước ngày bắt đầu.");
      const data = { title, loai: $("#f_loai").value, uu_tien: $("#f_uu").value, ngay_bd: bd, ngay_kt: kt,
        gio_bd: $("#f_gbd").value || null, gio_kt: $("#f_gkt").value || null, dia_diem: $("#f_dd").value.trim() || null,
        nguoi_pt: $("#f_pt").value.trim() || null, trang_thai: $("#f_ts").value, ket_qua: $("#f_kq").value.trim() || null,
        ghi_chu: $("#f_gc").value.trim() || null, lanh_dao_giao: $("#f_ldg").value.trim() || null, thoi_han_vb: $("#f_han").value || null,
        lanh_dao_tham_dinh: $("#f_ldtd").value.trim() || null, phoi_hop: $("#f_ph").value.trim() || null };
      if (!task) data.truc = C.goiYTruc(title);
      $("#f_save").disabled = true;
      const r = await guard(() => (task ? DB.Tasks.update(task.id, data) : DB.Tasks.insert(data)), "Đã lưu công việc.");
      $("#f_save").disabled = false;
      if (!r) return;
      if (task) Object.assign(S.tasks.find((x) => x.id === task.id), r); else S.tasks.push(r);
      dlg.close(); go(S.page);
    });
  }

  // ───────────── NHIỆM VỤ TUẦN TỚI ─────────────
  async function pageNwt(root) {
    const nm = C.addDays(C.mondayOf(C.today()), 7), [w0, y0] = C.isoWeek(nm);
    root.innerHTML = head("Nhiệm vụ tuần tới", "Dùng cho mục 2 của Mẫu Tổng hợp BC của CBCC VP — lên kế hoạch trước cho tuần sau.") + `
      <div class="card"><div class="form-grid">
        <label class="f">Tuần (số ISO)<input type="number" id="nTuan" min="1" max="53" value="${w0}"></label>
        <label class="f">Năm<input type="number" id="nNam" min="2020" max="2100" value="${y0}"></label>
        <label class="f span2">Nội dung nhiệm vụ (*)<input id="nND" placeholder="Nội dung nhiệm vụ"></label>
        <label class="f span2">Phối hợp (nếu có)<input id="nPH"></label>
        <label class="f span2">Thời gian hoàn thành dự kiến<input id="nTG" placeholder="VD: Trước 15/07"></label>
      </div><div class="dlg-foot" style="position:static"><button class="btn hidden" id="nCancel">Hủy sửa</button><button class="btn primary" id="nAdd">${ico("plus")} <span id="nAddL">Thêm vào tuần tới</span></button></div></div>
      <div class="section-label" id="nCap"></div>
      <div class="table-wrap cardwrap"><table class="tbl cards"><thead><tr><th style="width:56px">STT</th><th>Nội dung</th><th>Phối hợp</th><th>Thời gian hoàn thành dự kiến</th><th></th></tr></thead><tbody id="nBody"></tbody></table></div>`;
    let rows = [], editing = null;
    const key = () => [+$("#nTuan").value, +$("#nNam").value];
    async function load() {
      const [w, y] = key();
      rows = (await guard(() => DB.Nwt.query(w, y))) || [];
      $("#nCap").textContent = `TUẦN ${w}/${y}: ${rows.length} NHIỆM VỤ DỰ KIẾN`;
      $("#nBody").innerHTML = rows.length ? rows.map((r, i) => `<tr><td class="num" data-l="STT">${i + 1}</td><td class="ttl">${esc(r.noi_dung)}</td>
        <td data-l="Phối hợp">${esc(r.phoi_hop || "—")}</td><td data-l="Thời gian">${esc(r.thoi_gian_hoan_thanh || "—")}</td>
        <td class="act"><div class="tbl-actions"><button class="icon-btn" data-a="edit" data-id="${r.id}" title="Sửa">${ico("edit")}</button>
        <button class="icon-btn red" data-a="del" data-id="${r.id}" title="Xóa">${ico("trash")}</button></div></td></tr>`).join("")
        : `<tr><td colspan="5" class="empty">Chưa có nhiệm vụ nào cho tuần này.</td></tr>`;
    }
    const reset = () => { editing = null; $("#nND").value = $("#nPH").value = $("#nTG").value = ""; $("#nAddL").textContent = "Thêm vào tuần tới"; $("#nCancel").classList.add("hidden"); };
    $("#nTuan").addEventListener("change", () => { reset(); load(); }); $("#nNam").addEventListener("change", () => { reset(); load(); });
    $("#nCancel").onclick = reset;
    $("#nAdd").onclick = async () => {
      const nd = $("#nND").value.trim(); if (!nd) return toast("Vui lòng nhập nội dung nhiệm vụ.", true);
      const [w, y] = key(), d = { noi_dung: nd, phoi_hop: $("#nPH").value.trim(), thoi_gian_hoan_thanh: $("#nTG").value.trim(), tuan: w, nam: y };
      const r = await guard(() => (editing ? DB.Nwt.update(editing, d) : DB.Nwt.insert(d)), editing ? "Đã cập nhật." : "Đã thêm nhiệm vụ.");
      if (r) { reset(); load(); }
    };
    $("#nBody").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const r = rows.find((x) => x.id === +b.dataset.id); if (!r) return;
      if (b.dataset.a === "edit") {
        editing = r.id; $("#nND").value = r.noi_dung; $("#nPH").value = r.phoi_hop || ""; $("#nTG").value = r.thoi_gian_hoan_thanh || "";
        $("#nAddL").textContent = "Cập nhật nhiệm vụ"; $("#nCancel").classList.remove("hidden"); $("#nND").focus(); window.scrollTo(0, 0);
      } else if (await confirmDlg(`Xóa nhiệm vụ <b>${esc(r.noi_dung)}</b>?`)) {
        if (await guard(async () => { await DB.Nwt.remove(r.id); return true; }, "Đã xóa.")) { reset(); load(); }
      }
    });
    load();
  }

  // ───────────── BÁO CÁO & XUẤT FILE ─────────────
  function periodHtml(id, def) {
    const t = C.today(), ys = [];
    for (let y = t.getFullYear() - 5; y <= t.getFullYear() + 1; y++) ys.push(y);
    return `<div class="period" id="${id}">
      <label class="f">Kỳ báo cáo<select data-k="loai">${opts(C.KY_LOAI, def)}</select></label>
      <label class="f" data-for="Tuần">Chọn 1 ngày trong tuần<input type="date" data-k="ngay" value="${C.iso(t)}"></label>
      <label class="f" data-for="Tháng">Tháng<select data-k="thang">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}"${i === t.getMonth() ? " selected" : ""}>Tháng ${i + 1}</option>`).join("")}</select></label>
      <label class="f" data-for="Quý">Quý<select data-k="quy">${["I", "II", "III", "IV"].map((q, i) => `<option value="${i + 1}"${i === Math.floor(t.getMonth() / 3) ? " selected" : ""}>Quý ${q}</option>`).join("")}</select></label>
      <label class="f" data-for="Tháng,Quý,6 tháng đầu năm,9 tháng đầu năm,Năm">Năm<select data-k="nam">${ys.map((y) => `<option${y === t.getFullYear() ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="f" data-for="Tùy chọn">Từ ngày<input type="date" data-k="tu" value="${C.iso(new Date(t.getFullYear(), t.getMonth(), 1))}"></label>
      <label class="f" data-for="Tùy chọn">Đến ngày<input type="date" data-k="den" value="${C.iso(t)}"></label>
      <label class="f" data-for="Tùy chọn">Tên kỳ<input data-k="nhan" value="kỳ báo cáo"></label></div>`;
  }
  function periodGet(id) {
    const r = $("#" + id), g = (k) => $(`[data-k=${k}]`, r).value, loai = g("loai");
    return C.kyRange(loai, { ngay: C.parseISO(g("ngay")), thang: +g("thang"), quy: +g("quy"), nam: +g("nam"),
      tu: C.parseISO(g("tu")), den: C.parseISO(g("den")), nhan: g("nhan").trim() });
  }
  function periodWire(id, fn) {
    const r = $("#" + id), vis = () => { const l = $(`[data-k=loai]`, r).value; $$("[data-for]", r).forEach((x) => x.classList.toggle("hidden", !x.dataset.for.split(",").includes(l))); };
    r.addEventListener("change", () => { vis(); fn(); }); r.addEventListener("input", (e) => { if (e.target.dataset.k === "nhan") fn(); }); vis();
  }
  const tasksOf = (tu, den) => inRange(S.tasks, C.iso(tu), C.iso(den)).sort((a, b) => (a.ngay_bd + (a.gio_bd || "")).localeCompare(b.ngay_bd + (b.gio_bd || "")));

  function pageReports(root) {
    root.innerHTML = head("Báo cáo & Xuất file", "Xuất Word/Excel đúng mẫu quy định, tổng hợp tự động từ dữ liệu của bạn.") + `
      <div class="tabs" id="rTabs"><button>Mẫu Tổng hợp BC của CBCC VP (theo tuần)</button><button>Báo cáo tổng hợp theo kỳ</button><button>Đánh giá cán bộ (CV 1619)</button></div>
      <div id="rBody"></div>`;
    const draw = () => {
      $$("#rTabs button").forEach((b, i) => b.classList.toggle("on", i === S.tab));
      [tabCbcc, tabKy, tabCv][S.tab]($("#rBody"));
    };
    $("#rTabs").addEventListener("click", (e) => { const i = $$("#rTabs button").indexOf(e.target.closest("button")); if (i >= 0) { S.tab = i; draw(); } });
    draw();
  }

  function tabCbcc(root) {
    root.innerHTML = `<p class="hint">Xuất đúng bố cục Mẫu - Tổng hợp BC của CBCC VP: mục 1 lấy công việc thực hiện trong tuần đã chọn, mục 2 lấy danh sách ở trang Nhiệm vụ tuần tới.</p>
      <div class="card"><label class="f" style="max-width:260px">Tuần báo cáo — chọn 1 ngày bất kỳ trong tuần<input type="date" id="cDate" value="${C.iso(C.today())}"></label>
      <p id="cRng" style="font-weight:700;color:var(--navy);margin:12px 0 2px"></p><p id="cCnt" class="info-line" style="margin:0 0 14px"></p>
      <button class="btn primary" id="cGo">${ico("dl")} Xuất file Word theo Mẫu CBCC VP</button></div>`;
    const per = () => { const d = C.parseISO($("#cDate").value) || C.today(), mon = C.mondayOf(d); return [mon, C.addDays(mon, 6), C.addDays(mon, 7)]; };
    async function refresh() {
      const [mon, sun, nxt] = per(), [w, y] = C.isoWeek(mon), [w2, y2] = C.isoWeek(nxt);
      $("#cRng").textContent = `Khoảng ngày: ${C.fmtD(mon)} – ${C.fmtD(sun)}   ·   Tuần ISO: ${w}/${y}`;
      let n2 = "…"; $("#cCnt").textContent = `Mục 1 sẽ có ${tasksOf(mon, sun).length} công việc  ·  Mục 2: đang đếm…`;
      try { n2 = (await DB.Nwt.query(w2, y2)).length; } catch (e) { n2 = "?"; }
      $("#cCnt").textContent = `Mục 1 sẽ có ${tasksOf(mon, sun).length} công việc  ·  Mục 2 sẽ có ${n2} nhiệm vụ (tuần ${w2}/${y2})`;
    }
    $("#cDate").addEventListener("change", refresh);
    $("#cGo").onclick = () => guard(async () => {
      const [mon, sun, nxt] = per(), [w, y] = C.isoWeek(mon), [w2, y2] = C.isoWeek(nxt);
      const blob = await Reports.buildCbcc(S.cfg.ten || "", tasksOf(mon, sun), await DB.Nwt.query(w2, y2), w, y);
      saveBlob(blob, `BC_CBCC_Tuan${w}_${y}.docx`);
    }, "Đã tạo file Word — kiểm tra thư mục Tải xuống.");
    refresh();
  }

  function tabKy(root) {
    root.innerHTML = `<p class="hint">Báo cáo tổng hợp công tác theo tuần, tháng, quý, 6 tháng, 9 tháng hoặc năm — số liệu tự động từ dữ liệu của bạn.</p>
      ${periodHtml("kP", "Quý")}<div class="grid g4" id="kStats"></div>
      <div class="grid g2" style="margin:14px 0"><label class="f">Đề xuất mức xếp loại<select id="kXl">${opts(C.XL_MUC, C.XL_MUC[0])}</select></label></div>
      <div class="grid g2"><textarea id="kNx" rows="3" placeholder="Nhận xét, đánh giá bổ sung (không bắt buộc)"></textarea>
      <textarea id="kPh" rows="3" placeholder="Phương hướng nhiệm vụ tiếp theo (không bắt buộc) — mỗi dòng một ý"></textarea></div>
      <div class="table-wrap cardwrap" style="margin:14px 0"><table class="tbl cards"><thead><tr><th>Ngày</th><th>Nội dung</th><th>Loại</th><th>Trạng thái</th><th>Kết quả</th></tr></thead><tbody id="kBody"></tbody></table></div>
      <button class="btn primary" id="kGo">${ico("dl")} Xuất báo cáo Word theo kỳ</button>`;
    const calc = () => { const k = periodGet("kP"); return { k, d: C.tinhToanKy(tasksOf(k.tu, k.den), $("#kXl").value) }; };
    function refresh() {
      const { d } = calc();
      $("#kStats").innerHTML = stat("TỔNG CÔNG VIỆC", d.tong, "#2A5298") + stat("HOÀN THÀNH", d.ht, "#1A9651", d.pt + "%") + stat("TRỄ HẠN", d.tre, "#C8102E") +
        stat("ĐỀ XUẤT XẾP LOẠI", `<span style="font-size:16px;color:var(--navy)">${esc(d.xepLoai.replace(" nhiệm vụ", ""))}</span>`, "#F5A623");
      $("#kBody").innerHTML = d.tasks.length ? d.tasks.map((t) => `<tr><td data-l="Ngày">${C.fmtD(t.ngay_bd)}</td><td class="ttl">${esc(t.title)}</td><td data-l="Loại">${esc(t.loai || "")}</td><td class="st">${pill(t.trang_thai)}</td><td data-l="Kết quả">${esc(t.ket_qua || "")}</td></tr>`).join("")
        : `<tr><td colspan="5" class="empty">Chưa có công việc nào trong kỳ đã chọn.</td></tr>`;
    }
    periodWire("kP", refresh); $("#kXl").addEventListener("change", refresh);
    $("#kGo").onclick = () => guard(async () => {
      const { k, d } = calc();
      const blob = await Reports.buildKy(orgCfg(), S.cfg.ten || "", S.cfg.chuc_vu || "", k.tu, k.den, k.nhan, d, $("#kNx").value.trim(), $("#kPh").value.trim());
      saveBlob(blob, `BaoCao_${safe(k.nhan)}.docx`);
    }, "Đã tạo file Word — kiểm tra thư mục Tải xuống.");
    refresh();
  }

  // ── Đánh giá cán bộ CV 1619 ──
  function tabCv(root) {
    const PERS = [["ngay_sinh", "Ngày sinh", "VD: 15/03/1990"], ["chuc_vu_dang", "Chức vụ Đảng", "VD: Đảng viên"], ["chuc_vu_cq", "Chức vụ chính quyền", ""],
      ["chuc_vu_dt", "Chức vụ đoàn thể", "VD: Đoàn viên Công đoàn"], ["don_vi_ct", "Đơn vị công tác", ""]];
    root.innerHTML = `<p class="hint">Xuất file .xlsx đúng cấu trúc Bản tự đánh giá (MauDG) + Phụ lục 2 khối Đảng (PL2.khoiDang) theo Công văn 1619-CV/TU. Số dòng nhiệm vụ tự giãn theo đúng số việc thực tế.</p>
      ${periodHtml("vP", "Quý")}<p class="info-line" id="vInfo"></p>
      <div class="section-label">Thông tin cá nhân (lưu để dùng lại cho các kỳ sau)</div>
      <div class="card"><div class="form-grid">${PERS.map(([k, l, p]) => `<label class="f${k === "don_vi_ct" ? " span2" : ""}">${l}<input data-p="${k}" placeholder="${p}" value="${esc(S.cfg[k] || (k === "chuc_vu_cq" ? S.cfg.chuc_vu || "" : ""))}"></label>`).join("")}</div>
      <div class="dlg-foot" style="position:static;margin-top:10px"><button class="btn" id="vSavePers">Lưu thông tin cá nhân</button></div></div>
      <div class="section-label">Thông tin KPI từng nhiệm vụ trong kỳ</div>
      <p class="hint">Chọn Trục, Nhóm A/B, Nhóm độ khó N1–N5, số lượng và hệ số chất lượng cho từng việc. Trục chỉ được gợi ý theo từ khóa — bạn cần rà soát lại theo đúng nội dung thực tế.</p>
      <div class="table-wrap scroll"><table class="tbl kpi-table"><thead><tr><th>Nội dung</th><th>Trạng thái</th><th>Trục</th><th>Nhóm</th><th>Căn cứ giao việc</th><th title="Số lượng kế hoạch">SL KH</th><th title="Nhóm độ khó N1–N5">Độ khó</th><th title="Số lượng thực tế">SL TT</th><th title="Hệ số chất lượng">Hệ số CL</th></tr></thead><tbody id="vBody"></tbody></table></div>
      <p class="hint" style="margin-top:8px"><b>Độ khó:</b> ${C.NHOM_KHO_LIST.map((k) => `${k}: ${C.NHOM_KHO_GOI_Y[k]}`).join(" · ")}<br><b>Hệ số chất lượng:</b> ${C.HE_SO_CL_OPTS.map(([l, v]) => `${v}: ${l}`).join(" · ")}</p>
      <div id="vTruc" class="hint"></div>
      <div style="display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap"><button class="btn" id="vSuggest" title="Điền lại cột Trục theo từ khóa trong tên công việc (chưa lưu cho đến khi bấm Lưu)">Gợi ý lại Trục theo từ khóa</button><button class="btn" id="vSaveRows">Lưu các chỉnh sửa vào công việc</button></div>
      <div class="section-label">Tỷ trọng điểm & kết quả dự kiến</div>
      <div class="card"><div class="grid g2"><label class="f">Điểm tối đa Nhóm A (thường xuyên)<input type="number" id="vMa" min="0" max="100" value="60"></label>
      <label class="f">Điểm tối đa Nhóm B (trọng tâm, then chốt)<input type="number" id="vMb" min="0" max="100" value="40"></label></div>
      <div class="score-grid" id="vScore"></div><div class="warn" id="vWarn"></div></div>
      <div class="section-label">Nhóm tiêu chí chung (mục I của MauDG)</div>
      <p class="hint">Đánh dấu các tiêu chí <b>KHÔNG đảm bảo</b> — để trống nếu tất cả đều đảm bảo.</p>
      <div id="vTc">${C.MAUDG_TIEUCHI.map(([so, ten, items]) => `<details class="tc-group"><summary>${so}. ${esc(ten)}</summary>${items.map((it) => `<label class="tc-item"><input type="checkbox" data-tc="${esc(it)}"><span>${esc(it)}</span></label>`).join("")}</details>`).join("")}</div>
      <div class="grid g2" style="margin-top:16px;align-items:end"><label class="f">Cá nhân tự đề xuất mức xếp loại chất lượng<select id="vXl">${opts(C.XL_MUC.slice(1), "")}</select></label>
      <div><button class="btn primary" id="vGo">${ico("dl")} Xuất file Excel — Đánh giá cán bộ (CV 1619)</button></div></div>`;

    let list = [];
    const row = (t, i) => {
      const hs = t.he_so_chat_luong == null ? 1 : Number(t.he_so_chat_luong), ke = t.so_luong_ke_hoach || 1;
      const tt = t.so_luong_thuc_te != null ? t.so_luong_thuc_te : (t.trang_thai === "Hoàn thành" ? ke : 0);
      return `<tr data-i="${i}"><td class="t">${esc(t.title)}</td><td>${pill(t.trang_thai)}</td>
        <td><select class="w-md" data-f="truc">${opts(C.TRUC_LIST, t.truc || C.goiYTruc(t.title))}</select></td>
        <td><select class="w-lg" data-f="nhom_ab">${C.NHOM_AB.map((n) => `<option value="${esc(n)}"${n === (t.nhom_ab || C.NHOM_AB[0]) ? " selected" : ""}>${esc(C.NHOM_SHORT[n])}</option>`).join("")}</select></td>
        <td><input class="w-xl" data-f="can_cu_nv" value="${esc(t.can_cu_nv || "")}"></td>
        <td><input class="w-sm" type="number" min="1" data-f="so_luong_ke_hoach" value="${ke}"></td>
        <td><select class="w-sm" data-f="nhom_kho">${opts(C.NHOM_KHO_LIST, t.nhom_kho || "N2")}</select></td>
        <td><input class="w-sm" type="number" min="0" data-f="so_luong_thuc_te" value="${tt}"></td>
        <td><select class="w-sm" data-f="he_so_chat_luong">${C.HE_SO_CL_OPTS.map(([l, v]) => `<option value="${v}" title="${esc(l)}"${v === hs ? " selected" : ""}>${v}</option>`).join("")}</select></td></tr>`;
    };
    const read = (tr, t) => {
      const g = (f) => $(`[data-f=${f}]`, tr).value, n = (f) => Math.max(0, parseInt(g(f), 10) || 0);
      return { truc: g("truc"), nhom_ab: g("nhom_ab"), can_cu_nv: g("can_cu_nv").trim() || null, so_luong_ke_hoach: Math.max(1, n("so_luong_ke_hoach")),
        nhom_kho: g("nhom_kho"), so_luong_thuc_te: n("so_luong_thuc_te"), he_so_chat_luong: parseFloat(g("he_so_chat_luong")) };
    };
    const rowsData = () => $$("#vBody tr[data-i]").map((tr) => ({ t: list[+tr.dataset.i], d: read(tr) }));
    const maxes = () => [Math.max(0, +$("#vMa").value || 0), Math.max(0, +$("#vMb").value || 0)];
    function score() {
      const rd = rowsData(), merged = rd.map(({ t, d }) => ({ ...t, ...d }));
      const ga = merged.filter((t) => t.nhom_ab === C.NHOM_AB[0]), gb = merged.filter((t) => t.nhom_ab === C.NHOM_AB[1]);
      const [ma, mb] = maxes(), a = C.tinhKpi(ga).kpi * ma, b = C.tinhKpi(gb).kpi * mb;
      $("#vScore").innerHTML = stat("ĐIỂM NHÓM A", a.toFixed(1), "#2A5298", `/ ${ma} · ${ga.length} việc`) + stat("ĐIỂM NHÓM B", b.toFixed(1), "#E67E22", `/ ${mb} · ${gb.length} việc`) + stat("TỔNG ĐIỂM", (a + b).toFixed(1), "#C8102E", "/ 100");
      $("#vWarn").textContent = ma + mb === 100 ? "" : `Tổng điểm tối đa hiện tại: ${ma + mb} — cần đúng bằng 100.`;
      const tc = {}; merged.forEach((t) => { tc[t.truc] = (tc[t.truc] || 0) + 1; });
      const mx = merged.length ? Math.max(...Object.values(tc)) / merged.length : 0;
      $("#vTruc").innerHTML = "Phân bổ theo Trục: " + C.TRUC_LIST.map((k) => `${k}: ${tc[k] || 0} việc`).join(" · ") +
        (merged.length >= 5 && mx >= 0.7 ? `<br><b style="color:var(--red)">Phần lớn công việc đang dồn vào 1 trục — hãy rà soát lại theo đúng nội dung thực tế từng việc (không chọn trục theo tên phòng hay chức danh).</b>` : "");
      $("#vXl").selectedIndex = C.xepLoaiTheoDiem(a + b);
    }
    function refresh() {
      const k = periodGet("vP"); list = tasksOf(k.tu, k.den);
      $("#vInfo").textContent = list.length ? `Kỳ đã chọn có ${list.length} công việc.` : "Chưa có công việc nào trong kỳ đã chọn — vào trang Công việc để thêm trước.";
      $("#vBody").innerHTML = list.length ? list.map(row).join("") : `<tr><td colspan="9" class="empty">Chưa có công việc nào trong kỳ.</td></tr>`;
      score();
    }
    async function saveRows(quiet) {
      const changes = rowsData().filter(({ t, d }) => Object.keys(d).some((k) => String(t[k] ?? "") !== String(d[k] ?? "")));
      if (!changes.length) { if (!quiet) toast("Không có thay đổi nào để lưu."); return true; }
      const res = await guard(() => Promise.all(changes.map(({ t, d }) => DB.Tasks.update(t.id, d))), quiet ? null : `Đã lưu ${changes.length} công việc.`);
      if (!res) return false;
      res.forEach((r) => Object.assign(S.tasks.find((x) => x.id === r.id), r));
      refresh(); return true;
    }
    const persObj = () => Object.fromEntries($$("[data-p]", root).map((i) => [i.dataset.p, i.value.trim()]));
    async function savePers(quiet) {
      const o = persObj(); const r = await guard(async () => { await DB.Config.setMany(o); return true; }, quiet ? null : "Đã lưu thông tin cá nhân.");
      if (r) Object.assign(S.cfg, o); return !!r;
    }
    periodWire("vP", refresh);
    $("#vBody").addEventListener("input", score); $("#vBody").addEventListener("change", score);
    $("#vMa").addEventListener("input", score); $("#vMb").addEventListener("input", score);
    $("#vSuggest").onclick = () => { $$("#vBody tr[data-i]").forEach((tr) => { $("[data-f=truc]", tr).value = C.goiYTruc(list[+tr.dataset.i].title); }); score(); toast("Đã gợi ý Trục — nhớ rà soát lại rồi bấm Lưu."); };
    $("#vSavePers").onclick = () => savePers(false); $("#vSaveRows").onclick = () => saveRows(false);
    $("#vGo").onclick = async () => {
      if (!list.length) return alertDlg("Chưa có công việc nào trong kỳ đã chọn.");
      const [ma, mb] = maxes(); if (ma + mb !== 100) return alertDlg("Vui lòng chỉnh Điểm tối đa Nhóm A + Nhóm B cho đúng bằng 100 trước khi xuất.");
      if (!(await saveRows(true)) || !(await savePers(true))) return;
      const k = periodGet("vP"), kdb = $$("[data-tc]:checked", root).map((c) => c.dataset.tc);
      const info = { ten: S.cfg.ten || "", ngay_sinh: S.cfg.ngay_sinh, chuc_vu_dang: S.cfg.chuc_vu_dang, chuc_vu_cq: S.cfg.chuc_vu_cq || S.cfg.chuc_vu, chuc_vu_dt: S.cfg.chuc_vu_dt, don_vi_ct: S.cfg.don_vi_ct };
      guard(async () => {
        const blob = await Reports.buildCv1619(info, orgCfg(), list.map((t) => S.tasks.find((x) => x.id === t.id)), ma, mb, kdb, $("#vXl").value, `${k.nhan}, Năm ${k.den.getFullYear()}`);
        saveBlob(blob, `DanhGiaCanBo_${safe(k.nhan)}.xlsx`);
      }, "Đã tạo file Excel — kiểm tra thư mục Tải xuống.");
    };
    refresh();
  }

  // ───────────── CÀI ĐẶT ─────────────
  function pageSettings(root) {
    const F = [["ten", "Họ và tên (*)", "", 1], ["chuc_vu", "Chức vụ (hiển thị ở thanh bên)", "", 1], ["chuc_vu_day_du", "Chức vụ, đơn vị đầy đủ", "VD: Chuyên viên Văn phòng Ban Tuyên giáo Tỉnh ủy ...", 2],
      ["cap_uy", "Cấp ủy / cơ quan chủ quản", "VD: Tỉnh ủy Tuyên Quang", 1], ["ten_don_vi", "Tên đơn vị", "VD: Ban Tuyên giáo", 1], ["dia_danh", "Địa danh (nơi lập)", "VD: Tuyên Quang", 1], ["don_vi_ct", "Đơn vị công tác đầy đủ", "", 1]];
    root.innerHTML = head("Cài đặt", "Thông tin của bạn và thông tin cơ quan hiển thị trên các biểu mẫu Word/Excel.") + `
      <div class="card"><div class="form-grid g2" style="grid-template-columns:1fr 1fr">${F.map(([k, l, p, sp]) => `<label class="f${sp === 2 ? " span2" : ""}" ${sp === 2 ? 'style="grid-column:1/-1"' : ""}>${l}<input data-c="${k}" placeholder="${p}" value="${esc(S.cfg[k] || "")}"></label>`).join("")}</div>
      <div class="dlg-foot" style="position:static"><button class="btn primary" id="sSave">Lưu thay đổi</button></div></div>
      <div class="section-label">Tài khoản</div>
      <div class="card"><div class="form-grid" style="grid-template-columns:1fr 1fr"><label class="f">Mật khẩu mới (tối thiểu 8 ký tự)<input type="password" id="pw1" autocomplete="new-password"></label>
      <label class="f">Nhập lại mật khẩu mới<input type="password" id="pw2" autocomplete="new-password"></label></div>
      <div class="dlg-foot" style="position:static"><button class="btn" id="pwGo">Đổi mật khẩu</button></div></div>
      <div class="section-label">Sao lưu & khôi phục dữ liệu</div>
      <div class="card"><p class="hint">Dữ liệu được lưu trên Supabase. Nên tải một bản sao lưu (.json) về máy định kỳ, phòng khi dự án bị khóa hoặc xóa nhầm.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="bkGo">${ico("dl")} Tải bản sao lưu (.json)</button>
      <button class="btn" id="rsGo">${ico("ul")} Khôi phục từ file…</button><input type="file" id="rsFile" accept=".json,application/json" class="hidden"></div></div>`;
    $("#sSave").onclick = async () => {
      const o = Object.fromEntries($$("[data-c]", root).map((i) => [i.dataset.c, i.value.trim()]));
      if (!o.ten) return toast("Họ tên không được để trống.", true);
      if (!o.chuc_vu) o.chuc_vu = "Chuyên viên";
      if (await guard(async () => { await DB.Config.setMany(o); return true; }, "Đã cập nhật thông tin.")) { Object.assign(S.cfg, o); refreshUser(); }
    };
    $("#pwGo").onclick = async () => {
      const a = $("#pw1").value, b = $("#pw2").value;
      if (a.length < 8) return toast("Mật khẩu cần tối thiểu 8 ký tự.", true);
      if (a !== b) return toast("Hai mật khẩu chưa trùng nhau.", true);
      if (await guard(async () => { await DB.Auth.changePassword(a); return true; }, "Đã đổi mật khẩu.")) { $("#pw1").value = $("#pw2").value = ""; }
    };
    $("#bkGo").onclick = () => guard(async () => {
      const j = await DB.Backup.exportAll();
      saveBlob(new Blob([JSON.stringify(j, null, 1)], { type: "application/json" }), `sao_luu_cong_tac_${C.iso(C.today()).replace(/-/g, "")}.json`);
    }, "Đã tạo bản sao lưu — kiểm tra thư mục Tải xuống.");
    $("#rsGo").onclick = () => $("#rsFile").click();
    $("#rsFile").addEventListener("change", async (e) => {
      const f = e.target.files[0]; e.target.value = ""; if (!f) return;
      let obj; try { obj = JSON.parse(await f.text()); } catch (er) { return toast("File không đọc được.", true); }
      if (!(await confirmDlg(`Khôi phục từ <b>${esc(f.name)}</b>?<br><span class="muted">Các công việc trùng mã sẽ bị ghi đè; không xóa dữ liệu hiện có.</span>`, "Khôi phục"))) return;
      const r = await guard(() => DB.Backup.importAll(obj));
      if (r) { S.tasks = await DB.Tasks.all(); S.cfg = await DB.Config.all(); refreshUser(); toast(`Đã khôi phục ${r.tasks} công việc, ${r.nwt} nhiệm vụ tuần tới.`); go("settings"); }
    });
  }

  // ───────────── GIỚI THIỆU ─────────────
  function pageAbout(root) {
    const D = APP.dev;
    root.innerHTML = head("Giới thiệu", "") + `<div class="card"><div class="about"><img src="assets/logo.png" alt="Logo Ban Tuyên giáo">
      <div><h2 style="font-size:22px">Quản lý Công tác Cá nhân</h2><p class="muted" style="margin:4px 0">Phiên bản ${APP.version} · ${APP.year} · Bản web (GitHub Pages + Supabase)</p>
      <p style="margin:8px 0 0">Ghi chép, theo dõi công việc hằng ngày và xuất báo cáo Word/Excel đúng mẫu quy định.</p></div></div></div>
      <div class="section-label">Thông tin người phát triển</div>
      <div class="card">${[["Họ và tên", D.name], ["Chức vụ", D.role], ["Đơn vị", D.org], ["Điện thoại / Zalo", `<a href="tel:${D.phone}">${D.phone}</a>`], ["Email", `<a href="mailto:${D.email}">${D.email}</a>`]]
        .map(([l, v]) => `<div class="dev-row"><span>${l}</span><b>${v}</b></div>`).join("")}</div>
      <div class="note" style="margin-top:14px">Báo cáo được tạo ngay trên trình duyệt của bạn; dữ liệu công việc chỉ đọc được khi đã đăng nhập.</div>`;
  }

  boot();
})();
