/* Xuất báo cáo ngay trên trình duyệt: Word (.docx) bằng docx.js, Excel (.xlsx) bằng ExcelJS. */
(function (G) {
  "use strict";
  const C = G.Core;
  const NAVY_HDR = "1B3A6B";
  const FONT = "Times New Roman";
  const CM = 567; // 1 cm = 567 twips

  // ───────────────────────── WORD ─────────────────────────
  function runs(text, o) {
    o = o || {};
    const parts = String(text == null ? "" : text).split("\n");
    return parts.map((p, i) => new docx.TextRun({ text: p, break: i ? 1 : 0, bold: !!o.bold, italics: !!o.italics,
      size: Math.round((o.size || 12) * 2), color: o.color, font: FONT }));
  }
  const para = (text, o) => {
    o = o || {};
    return new docx.Paragraph({ alignment: o.align, spacing: { before: o.before || 0, after: o.after == null ? 80 : o.after },
      heading: o.heading, children: runs(text, o) });
  };
  const blank = () => new docx.Paragraph({ children: [] });

  function mkTable(widthsCm, totalCm, headers, rows, o) {
    o = o || {};
    const sc = totalCm / widthsCm.reduce((a, b) => a + b, 0);
    const w = widthsCm.map((x) => Math.round(x * sc * CM));
    const total = w.reduce((a, b) => a + b, 0);
    const bd = { style: docx.BorderStyle.SINGLE, size: 4, color: "000000" };
    const borders = { top: bd, bottom: bd, left: bd, right: bd };
    const center = new Set(o.center || []);
    const mkCell = (text, i, head) => new docx.TableCell({
      width: { size: w[i], type: docx.WidthType.DXA }, borders,
      verticalAlign: docx.VerticalAlign.CENTER,
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      shading: head ? { type: docx.ShadingType.CLEAR, fill: NAVY_HDR, color: "auto" } : undefined,
      children: [new docx.Paragraph({ alignment: head || center.has(i) ? docx.AlignmentType.CENTER : docx.AlignmentType.LEFT,
        children: runs(text, { size: head ? 10.5 : (o.size || 10), bold: head, color: head ? "FFFFFF" : undefined }) })],
    });
    const trs = [new docx.TableRow({ tableHeader: true, children: headers.map((h, i) => mkCell(h, i, true)) })];
    rows.forEach((r) => trs.push(new docx.TableRow({ cantSplit: true, children: r.map((v, i) => mkCell(v, i, false)) })));
    if (!rows.length) trs.push(new docx.TableRow({ children: headers.map((_, i) => mkCell("", i, false)) }));
    return new docx.Table({ width: { size: total, type: docx.WidthType.DXA }, columnWidths: w,
      layout: docx.TableLayoutType.FIXED, rows: trs });
  }

  function mkDoc(children, marginsCm) {
    const m = marginsCm || { top: 2, bottom: 2, left: 2, right: 2 };
    return new docx.Document({
      creator: "Quản lý Công tác Cá nhân",
      styles: { default: { document: { run: { font: FONT, size: 24 } } } },
      sections: [{ properties: { page: { size: { width: 11906, height: 16838 },
        margin: { top: m.top * CM, bottom: m.bottom * CM, left: m.left * CM, right: m.right * CM } } }, children }],
    });
  }
  const toBlob = (doc) => docx.Packer.toBlob(doc);

  /** Mẫu "Tổng hợp BC của CBCC VP" theo tuần. */
  function buildCbcc(ten, tasksKy, nwtRows, tuanSo, nam) {
    const ch = [];
    ch.push(new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, spacing: { after: 60 },
      children: runs("TỔNG HỢP BÁO CÁO CÔNG TÁC TUẦN", { bold: true, size: 13, color: NAVY_HDR }) }));
    ch.push(new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, spacing: { after: 200 },
      children: runs(`Tuần ${tuanSo}/${nam}`, { bold: true, size: 12 }) }));
    ch.push(new docx.Paragraph({ spacing: { after: 160 }, children: [...runs("Họ và tên: ", { bold: true, size: 12 }), ...runs(ten, { size: 12 })] }));
    ch.push(para("1. Kết quả thực hiện nhiệm vụ", { bold: true, size: 12, before: 60 }));
    ch.push(mkTable([1.3, 4.8, 2.5, 2.4, 2.2, 2.4, 2.5], 17,
      ["STT", "Nội dung", "Lãnh đạo giao", "Thời gian được giao", "Thời hạn của VB", "Thời gian hoàn thành", "Lãnh đạo thẩm định, duyệt"],
      tasksKy.map((t, i) => [String(i + 1), t.title, t.lanh_dao_giao || "", C.fmtD(t.ngay_bd), C.fmtD(t.thoi_han_vb),
        t.trang_thai === "Hoàn thành" ? C.fmtD(t.ngay_kt) : "", t.lanh_dao_tham_dinh || ""]),
      { center: [0, 3, 4, 5], size: 9.5 }));
    ch.push(blank());
    ch.push(para("2. Nhiệm vụ tuần tới", { bold: true, size: 12, before: 60 }));
    ch.push(mkTable([1.3, 8, 3, 4], 17, ["STT", "Nội dung", "Phối hợp (nếu có)", "Thời gian hoàn thành"],
      nwtRows.map((t, i) => [String(i + 1), t.noi_dung, t.phoi_hop || "", t.thoi_gian_hoan_thanh || ""]),
      { center: [0], size: 9.5 }));
    return toBlob(mkDoc(ch));
  }

  /** Báo cáo tổng hợp theo kỳ. org = {cap_uy, ten_don_vi, dia_danh}. */
  function buildKy(org, ten, chucVu, tu, den, td, d, nhanXet, phuongHuong) {
    const ch = [];
    const centerP = (txt, o) => new docx.Paragraph({ alignment: docx.AlignmentType.CENTER, spacing: { after: 40 }, children: runs(txt, o) });
    ch.push(centerP("ĐẢNG CỘNG SẢN VIỆT NAM", { bold: true, size: 13 }));
    if (org.cap_uy) ch.push(centerP(org.cap_uy.toUpperCase(), { bold: true, size: 12 }));
    if (org.ten_don_vi) ch.push(centerP(org.ten_don_vi, { size: 11 }));
    ch.push(blank());
    ch.push(centerP(`BÁO CÁO CÔNG TÁC ${td.toUpperCase()}`, { bold: true, size: 14, color: NAVY_HDR }));
    ch.push(centerP(`(Từ ngày ${C.fmtD(tu)} đến ngày ${C.fmtD(den)})`, { size: 11 }));
    ch.push(blank());
    ch.push(new docx.Paragraph({ alignment: docx.AlignmentType.RIGHT,
      children: runs(`Người lập: ${ten}\nChức vụ: ${chucVu}\nNgày lập: ${C.fmtD(C.today())}`, { size: 10 }) }));
    ch.push(blank());
    const H = (t) => para(t, { bold: true, size: 13, color: NAVY_HDR, before: 120, after: 100, heading: docx.HeadingLevel.HEADING_2 });

    ch.push(H("I. TỔNG KẾT KẾT QUẢ"));
    ch.push(mkTable([9, 4, 4], 16.5, ["Chỉ tiêu", "Số lượng", "Tỷ lệ"], [
      ["Tổng số công việc", String(d.tong), "100%"], ["Đã hoàn thành", String(d.ht), `${d.pt}%`],
      ["Đang thực hiện", String(d.dang), ""], ["Trễ hạn", String(d.tre), ""]], { center: [1, 2], size: 10 }));
    ch.push(blank());
    const loai = Object.entries(d.theoLoai).sort((a, b) => b[1] - a[1]);
    if (loai.length) {
      ch.push(para("Phân loại theo tính chất công việc:", { bold: true }));
      ch.push(mkTable([13, 4], 16.5, ["Loại công việc", "Số lượng"], loai.map(([k, v]) => [k, String(v)]), { center: [1] }));
      ch.push(blank());
    }
    ch.push(H("II. CHI TIẾT CÔNG VIỆC"));
    ch.push(mkTable([1.3, 2.2, 6, 3, 2.2, 2.3, 2.3], 16.5,
      ["STT", "Ngày", "Nội dung công việc", "Loại việc", "Thời gian", "Trạng thái", "Kết quả"],
      d.tasks.map((t, i) => {
        const gio = [t.gio_bd || "", t.gio_kt || ""].join("-").replace(/^-|-$/g, "") || "Cả ngày";
        return [String(i + 1), C.fmtD(t.ngay_bd), t.title, t.loai || "", gio, t.trang_thai, t.ket_qua || ""];
      }), { center: [0, 1, 4, 5], size: 10 }));
    ch.push(blank());
    if (d.noiBat.length) {
      ch.push(H("III. SẢN PHẨM, GIẢI PHÁP NỔI BẬT TRONG KỲ"));
      d.noiBat.forEach((t) => ch.push(new docx.Paragraph({ bullet: { level: 0 }, spacing: { after: 60 },
        children: [...runs(t.title, { bold: true }), ...(t.ket_qua ? runs(` — ${t.ket_qua}`) : [])] })));
      ch.push(blank());
    }
    ch.push(H("IV. NHẬN XÉT, ĐÁNH GIÁ"));
    ch.push(para(`- Hoàn thành ${d.ht}/${d.tong} công việc, đạt tỷ lệ ${d.pt}%.`));
    if (d.tre) ch.push(para(`- Còn ${d.tre} việc trễ hạn, cần rút kinh nghiệm về tiến độ.`));
    if (nhanXet) ch.push(para(`- ${nhanXet}`));
    ch.push(blank());
    ch.push(H("V. PHƯƠNG HƯỚNG NHIỆM VỤ TIẾP THEO"));
    const ph = (phuongHuong || "").split("\n").map((s) => s.trim()).filter(Boolean);
    if (ph.length) ph.forEach((l) => ch.push(para(`- ${l}`)));
    else ch.push(para("- Tiếp tục thực hiện các nhiệm vụ được phân công."));
    ch.push(blank());
    ch.push(H("VI. ĐỀ XUẤT MỨC XẾP LOẠI"));
    ch.push(para(d.xepLoai, { bold: true, size: 12 }));
    ch.push(para(`Căn cứ đề xuất: ${d.canCu}`, { italics: true, size: 10.5 }));
    ch.push(blank());
    ch.push(new docx.Paragraph({ alignment: docx.AlignmentType.RIGHT, children: [
      ...runs(C.noiNgay(C.today(), org.dia_danh) + "\n", { size: 11 }), ...runs("NGƯỜI LẬP BÁO CÁO\n\n\n\n", { bold: true }), ...runs(ten, { bold: true })] }));
    return toBlob(mkDoc(ch, { top: 2, bottom: 2, left: 2.5, right: 2 }));
  }

  // ───────────────────────── EXCEL (CV 1619) ─────────────────────────
  const colL = (n) => { let s = ""; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const R2 = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

  /** info: {ten, ngay_sinh, chuc_vu_dang, chuc_vu_cq, chuc_vu_dt, don_vi_ct}; org: {cap_uy, ten_don_vi, dia_danh} */
  async function buildCv1619(info, org, tasks, maxA, maxB, khongDamBao, xepLoai, kyLabel) {
    const wb = new ExcelJS.Workbook();
    wb.creator = info.ten || "Quản lý Công tác Cá nhân";
    const thin = { style: "thin" };
    const BRD = { top: thin, left: thin, bottom: thin, right: thin };
    const F = (o) => Object.assign({ name: FONT, size: 11 }, o || {});
    const AL = {
      center: { horizontal: "center", vertical: "middle", wrapText: true },
      wrap: { vertical: "top", wrapText: true },
    };
    const HDR_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + NAVY_HDR } };
    const cell = (ws, addr, value, o) => {
      o = o || {};
      const c = ws.getCell(addr);
      if (value !== undefined && value !== null) c.value = value;
      c.font = o.font || F();
      if (o.align) c.alignment = o.align;
      if (o.fill) c.fill = o.fill;
      if (o.brd) c.border = BRD;
      return c;
    };
    const merge = (ws, rng) => { const [a, b] = rng.split(":"); if (a !== b) ws.mergeCells(rng); };
    const borderRow = (ws, r, from = 1, to = 18) => { for (let i = from; i <= to; i++) { const c = ws.getCell(r, i); c.border = BRD; if (!c.font || c.font.name !== FONT) c.font = F(); } };
    const bold = F({ bold: true }), bold14 = F({ bold: true, size: 14 }), italic = F({ italic: true });
    const hdrFont = F({ bold: true, color: { argb: "FFFFFFFF" } });

    const kdb = new Set(khongDamBao || []);
    org = Object.assign({}, org, { cap_uy: (org && org.cap_uy) || "Tỉnh ủy Tuyên Quang", ten_don_vi: (org && org.ten_don_vi) || "Ban Tuyên giáo", dia_danh: (org && org.dia_danh) || "Tuyên Quang" });
    const tenGoi = (info.ten || "").trim().split(/\s+/).pop() || "CaNhan";
    const fmtNs = (s) => (/^\d{4}-\d{2}-\d{2}/.test(s || "") ? C.fmtD(s) : (s || ""));
    const dot = (s) => { s = (s || "").trim(); return s && !/[.]$/.test(s) ? s + "." : s; };
    const tenTruc = (t) => { const s = C.TRUC_TEN[t]; return t === "Trục 4" ? "Kết quả " + s.charAt(0).toLowerCase() + s.slice(1) : s; };
    const tienDoText = (t, x) => {
      if (t.trang_thai !== "Hoàn thành" || !x.k) return "Chưa HT";
      if (x.q >= 1) return "Đúng TĐ";
      return "Chậm TĐ";
    };

    // ── Sheet 1: MauDG <Tên> ──
    const ws = wb.addWorksheet("MauDG " + tenGoi, { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [6, 46, 12, 12, 12].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    cell(ws, "A1", (org.cap_uy || "").toUpperCase(), { font: bold });
    cell(ws, "C1", "ĐẢNG CỘNG SẢN VIỆT NAM", { font: bold });
    cell(ws, "A2", (org.ten_don_vi || "").toUpperCase());
    cell(ws, "C2", C.noiNgay(C.today(), org.dia_danh), { font: italic });
    cell(ws, "A4", "BẢN TỰ ĐÁNH GIÁ, XẾP LOẠI CỦA CÁ NHÂN", { font: bold14, align: AL.center }); merge(ws, "A4:E4");
    cell(ws, "A5", String(kyLabel).replace(/^(Quý [IV]+)\/\d{4},/, "$1,"), { font: bold, align: AL.center }); merge(ws, "A5:E5");

    let r0 = 7;
    [`Họ và tên: ${info.ten || ""}; Ngày sinh: ${fmtNs(info.ngay_sinh)}.`, `Chức vụ Đảng: ${dot(info.chuc_vu_dang)}`,
      `Chức vụ chính quyền: ${info.chuc_vu_cq || ""}`, `Chức vụ đoàn thể: ${dot(info.chuc_vu_dt) || "Không."}`, `Đơn vị công tác: ${dot(info.don_vi_ct)}`]
      .forEach((txt) => { cell(ws, `B${r0}`, txt); merge(ws, `B${r0}:E${r0}`); r0++; });

    r0++;
    cell(ws, `A${r0}`, "1. Tự đánh giá kết quả thực hiện nhiệm vụ: Trên cơ sở nhiệm vụ được giao, cá nhân tự đánh giá về kết quả thực hiện nhiệm vụ theo quý như sau:", { align: AL.wrap });
    merge(ws, `A${r0}:E${r0}`); ws.getRow(r0).height = 32; r0++;
    cell(ws, `A${r0}`, "I", { font: bold, align: { horizontal: "center", vertical: "top" } });
    cell(ws, `B${r0}`, "NHÓM TIÊU CHÍ CHUNG:", { font: bold, align: AL.wrap });
    merge(ws, `B${r0}:E${r0}`); r0++;
    ["TT", "Tiêu chí/Nội dung", "Đảm bảo\n(Đánh dấu X)", "Không đảm bảo\n(Đánh dấu X)"].forEach((h, i) => {
      cell(ws, `${colL(i + 1)}${r0}`, h, { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true });
    });
    merge(ws, `D${r0}:E${r0}`); borderRow(ws, r0, 1, 5); ws.getRow(r0).height = 32; r0++;
    const XC = { horizontal: "center", vertical: "top" };
    C.MAUDG_TIEUCHI.forEach(([so, ten, items]) => {
      const allOk = items.every((it) => !kdb.has(it));
      cell(ws, `A${r0}`, so, { font: bold, brd: true, align: XC });
      cell(ws, `B${r0}`, ten, { font: bold, align: AL.wrap, brd: true });
      cell(ws, `C${r0}`, allOk ? "X" : "", { font: bold, align: XC, brd: true });
      cell(ws, `D${r0}`, allOk ? "" : "X", { font: bold, align: XC, brd: true });
      merge(ws, `D${r0}:E${r0}`); borderRow(ws, r0, 1, 5);
      ws.getRow(r0).height = Math.max(18, Math.ceil(ten.length / 50) * 15);
      r0++;
      items.forEach((it) => {
        const ok = !kdb.has(it);
        const m = /^(\d+\.\d+)\.\s*(.*)$/s.exec(it);
        const num = m ? m[1] : "", txt = m ? m[2] : it;
        cell(ws, `A${r0}`, num, { brd: true, align: XC });
        cell(ws, `B${r0}`, txt, { align: AL.wrap, brd: true });
        cell(ws, `C${r0}`, ok ? "X" : "", { align: XC, brd: true });
        cell(ws, `D${r0}`, ok ? "" : "X", { align: XC, brd: true });
        merge(ws, `D${r0}:E${r0}`); borderRow(ws, r0, 1, 5);
        ws.getRow(r0).height = Math.max(18, Math.ceil(txt.length / 52) * 15);
        r0++;
      });
    });

    r0++;
    cell(ws, `A${r0}`, "II", { font: bold, align: { horizontal: "center", vertical: "top" } });
    cell(ws, `B${r0}`, "NHÓM KẾT QUẢ THỰC HIỆN NHIỆM VỤ: Có Phụ lục tiêu chí cho từng nhóm đối tượng, cá nhân tự đánh giá theo Phụ lục tương ứng kèm theo.", { font: bold, align: AL.wrap });
    merge(ws, `B${r0}:E${r0}`); ws.getRow(r0).height = 48; r0++;
    cell(ws, `A${r0}`, "Tự chấm điểm kết quả thực hiện nhiệm vụ. Trong đó:", { align: AL.wrap });
    merge(ws, `A${r0}:E${r0}`); r0++;
    ["TT", "Nhiệm vụ", "Điểm KPI", "Điểm tối đa", "Điểm đạt được"].forEach((h, i) => {
      cell(ws, `${colL(i + 1)}${r0}`, h, { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true });
    });
    r0++;

    const grpA = tasks.filter((t) => (t.nhom_ab || C.NHOM_AB[0]) === C.NHOM_AB[0]);
    const grpB = tasks.filter((t) => (t.nhom_ab || C.NHOM_AB[0]) === C.NHOM_AB[1]);
    const tong100 = (maxA + maxB) || 100;

    // ── Sheet 2: phụ lục (tên gọi) ──
    const w2 = wb.addWorksheet(tenGoi, { views: [{ showGridLines: false }], pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    [7, 24, 18, 20, 8, 12, 6, 7, 8, 9, 9, 8, 9, 8, 9, 12, 8, 9].forEach((w, i) => { w2.getColumn(i + 1).width = w; });
    cell(w2, "A1", "PHỤ LỤC 3: ĐỊNH HƯỚNG KHUNG DANH MỤC SẢN PHẨM/CÔNG VIỆC", { font: bold14, align: { horizontal: "center" } }); merge(w2, "A1:R1");
    cell(w2, "A2", `Họ và tên: ${info.ten || ""}, Chức vụ: ${info.chuc_vu_cq || ""}`, { font: bold }); merge(w2, "A2:R2");
    let r = 4;
    cell(w2, `A${r}`, "KẾ HOẠCH TRIỂN KHAI", { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true }); merge(w2, `A${r}:J${r + 1}`);
    cell(w2, `K${r}`, "KẾT QUẢ THỰC HIỆN", { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true }); merge(w2, `K${r}:R${r}`);
    cell(w2, `K${r + 1}`, "KPI Số lượng (A)", { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true }); merge(w2, `K${r + 1}:M${r + 1}`);
    cell(w2, `N${r + 1}`, "KPI Chất lượng (B)", { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true }); merge(w2, `N${r + 1}:O${r + 1}`);
    cell(w2, `P${r + 1}`, "KPI Tiến độ (C)", { font: hdrFont, align: AL.center, fill: HDR_FILL, brd: true }); merge(w2, `P${r + 1}:R${r + 1}`);
    borderRow(w2, r); borderRow(w2, r + 1); r += 2;
    ["STT", "Nhiệm vụ đề ra", "Căn cứ xác định nhiệm vụ (C.trình công tác, nhiệm vụ được giao)",
      "Sản phẩm/kết quả của nhiệm vụ đề ra (Ghi rõ số VB, ngày tháng ban hành để đánh giá tiến độ hoàn thành công việc)",
      "Số lượng công việc/chỉ tiêu đề ra (ghi rõ số lượng; số liệu phải thực hiện)", "Tiến độ/thời hạn phải hoàn thành nhiệm vụ đề ra",
      "Nhóm cách xác định mức độ tại PL1; ghi tắt là N1..N5", "Hệ số quy đổi", "Điểm theo danh mục công việc", "Tổng điểm quy đổi theo công việc",
      "Thực tế hoàn thành (ghi rõ số lượng; số liệu đã thực hiện)", "% mức độ hoàn thành công việc", "Điểm thực hiện thực tế",
      "Hệ số chất lượng sản phẩm/mức HT chỉ tiêu (các xác định tại PL1)", "Điểm thực hiện thực tế", "Ngày hoàn thành/tỷ lệ HT (các xác định tại PL1)",
      "Hệ số tiến độ hoàn thành sản phẩm/chỉ tiêu", "Điểm thực hiện thực tế"]
      .forEach((h, i) => cell(w2, `${colL(i + 1)}${r}`, h, { font: F({ bold: true, size: 9, color: { argb: "FFFFFFFF" } }), align: AL.center, fill: HDR_FILL, brd: true }));
    w2.getRow(r).height = 120; r++;
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12= 11/5", "13= 10*12", "14", "15= 13*14", "16", "17", "18= 13*17"]
      .forEach((h, i) => cell(w2, `${colL(i + 1)}${r}`, h, { font: F({ bold: true, size: 9 }), align: AL.center, brd: true }));
    r++;

    const vietNhom = (lbl, title, list, maxD) => {
      cell(w2, `A${r}`, title, { font: bold }); merge(w2, `A${r}:R${r}`); borderRow(w2, r); r++;
      const subRows = [];
      C.TRUC_LIST.forEach((truc, ti) => {
        const ofTruc = list.filter((t) => (t.truc || C.TRUC_LIST[0]) === truc);
        if (!ofTruc.length) return;
        cell(w2, `A${r}`, truc, { font: bold });
        cell(w2, `B${r}`, `${tenTruc(truc)} (${C.TRUC_DIEM_KHOI_DANG[truc]}%=${C.TRUC_DIEM_KHOI_DANG[truc]} điểm)`, { font: bold, align: AL.wrap });
        merge(w2, `B${r}:R${r}`); borderRow(w2, r); w2.getRow(r).height = 20; r++;
        const first = r;
        let sJ = 0, sM = 0, sO = 0, sR = 0;
        ofTruc.forEach((t, si) => {
          const x = C.tinhKpi([t]).rows[0];
          if (!x.k) x.q = 0;
          const pts = C.NHOM_KHO_DIEM[x.nk] || 40;
          const m = pts * x.l, o = m * x.n, rr = m * x.q;
          sJ += pts; sM += m; sO += o; sR += rr;
          const sp = fmtNs(t.ngay_kt) || t.ket_qua || "";
          const vals = [`${lbl}.${ti + 1}.${si + 1}`, t.title, t.can_cu_nv || "Nhiệm vụ lãnh đạo giao", sp, x.e, C.fmtD(t.thoi_han_vb), x.nk, x.j, pts, pts,
            x.k, { formula: `K${r}/E${r}`, result: x.l }, { formula: `J${r}*L${r}`, result: m }, x.n,
            { formula: `M${r}*N${r}`, result: o }, tienDoText(t, x), x.q, { formula: `M${r}*Q${r}`, result: rr }];
          vals.forEach((v, i) => cell(w2, `${colL(i + 1)}${r}`, v, { align: [1, 2, 3].includes(i) ? AL.wrap : AL.center, brd: true }));
          const ln = Math.max(Math.ceil(String(t.title).length / 27), Math.ceil(String(t.can_cu_nv || "").length / 21), Math.ceil(String(sp).length / 23), 1);
          w2.getRow(r).height = Math.max(18, ln * 14.5 + 4);
          r++;
        });
        const last = r - 1;
        cell(w2, `B${r}`, `Tổng điểm công việc ${truc}`, { font: bold });
        [["J", sJ], ["M", sM], ["O", sO], ["R", sR]].forEach(([c, v]) =>
          cell(w2, `${c}${r}`, { formula: `ROUND(SUM(${c}${first}:${c}${last}),2)`, result: R2(v, 2) }, { font: bold, align: AL.center }));
        borderRow(w2, r); subRows.push({ r, sJ, sM, sO, sR }); r++;
      });
      const T = subRows.reduce((a, s) => ({ J: a.J + s.sJ, M: a.M + s.sM, O: a.O + s.sO, R: a.R + s.sR }), { J: 0, M: 0, O: 0, R: 0 });
      const sumF = (c) => subRows.length ? subRows.map((s) => `${c}${s.r}`).join("+") : "0";
      const tot = r;
      cell(w2, `B${r}`, `TỔNG ĐIỂM NHÓM ${lbl}`, { font: bold }); cell(w2, `C${r}`, maxD, { font: bold, align: AL.center });
      [["J", T.J], ["M", T.M], ["O", T.O], ["R", T.R]].forEach(([c, v]) =>
        cell(w2, `${c}${r}`, { formula: `ROUND(${sumF(c)},2)`, result: R2(v, 2) }, { font: bold, align: AL.center }));
      borderRow(w2, r); r++;
      const kpi = T.J ? (T.M / T.J + T.O / T.J + T.R / T.J) / 3 : 0;
      cell(w2, `B${r}`, "ĐIỂM KPI=(A+B+C)/3/Tổng điểm quy đổi", { font: bold });
      cell(w2, `C${r}`, { formula: `IF(J${tot}=0,0,(M${tot}/J${tot}+O${tot}/J${tot}+R${tot}/J${tot})/3)`, result: kpi }, { font: bold, align: AL.center });
      w2.getCell(`C${r}`).numFmt = "0.0000";
      borderRow(w2, r); r++;
      const d = R2(kpi * maxD);
      cell(w2, `B${r}`, "ĐIỂM THỰC HIỆN=điểm KPI x điểm tối đa của Nhóm", { font: bold });
      cell(w2, `C${r}`, { formula: `ROUND(C${r - 1}*C${tot},2)`, result: d }, { font: bold, align: AL.center });
      w2.getCell(`C${r}`).numFmt = "0.00";
      borderRow(w2, r); r += 2;
      return { kpi, d, ref: `C${r - 2}` };
    };
    const a2 = vietNhom("A", `NHÓM A: NHIỆM VỤ THƯỜNG XUYÊN: ${maxA}%=${maxA} điểm`, grpA, maxA);
    const b2 = vietNhom("B", `NHÓM B: NHIỆM VỤ TRỌNG TÂM, THEN CHỐT (${maxB}%=${maxB} điểm)`, grpB, maxB);
    const tong = a2.d + b2.d;
    cell(w2, `B${r}`, "TỔNG ĐIỂM KẾT QUẢ THỰC HIỆN NHIỆM VỤ (A+B)", { font: bold14 });
    cell(w2, `C${r}`, { formula: `ROUND(${a2.ref}+${b2.ref},2)`, result: R2(tong) }, { font: bold14, align: AL.center });
    w2.getCell(`C${r}`).numFmt = "0.00"; borderRow(w2, r);

    // ── Hoàn tất sheet 1: bảng điểm + ký tên ──
    [["A", "Nhóm nhiệm vụ thường xuyên", maxA / tong100, maxA, a2.d], ["B", "Nhóm nhiệm vụ trọng tâm then chốt", maxB / tong100, maxB, b2.d]].forEach(([l, n, k, m, d]) => {
      cell(ws, `A${r0}`, l, { align: AL.center, brd: true });
      cell(ws, `B${r0}`, n, { align: AL.wrap, brd: true });
      cell(ws, `C${r0}`, k, { align: AL.center, brd: true });
      ws.getCell(`C${r0}`).numFmt = "0.0";
      cell(ws, `D${r0}`, m, { align: AL.center, brd: true });
      cell(ws, `E${r0}`, d, { align: AL.center, brd: true });
      ws.getCell(`E${r0}`).numFmt = "0.00";
      r0++;
    });
    cell(ws, `A${r0}`, "", { brd: true });
    cell(ws, `B${r0}`, "Tổng điểm", { font: bold, brd: true });
    cell(ws, `C${r0}`, (maxA + maxB) / tong100, { font: bold, align: AL.center, brd: true });
    cell(ws, `D${r0}`, maxA + maxB, { font: bold, align: AL.center, brd: true });
    cell(ws, `E${r0}`, R2(tong), { font: bold, align: AL.center, brd: true });
    r0++;
    cell(ws, `A${r0}`, "(Gửi kèm bảng chấm điểm, minh chứng sản phẩm cụ thể)", { font: italic }); merge(ws, `A${r0}:E${r0}`); r0 += 2;

    cell(ws, `A${r0}`, `2. Cá nhân tự đề xuất mức xếp loại chất lượng: ${xepLoai}`, { font: bold, align: AL.wrap });
    merge(ws, `A${r0}:E${r0}`); ws.getRow(r0).height = 32; r0 += 3;
    cell(ws, `C${r0}`, "CÁ NHÂN TỰ ĐÁNH GIÁ\n(Ký, ghi rõ họ tên)", { font: bold, align: AL.center });
    merge(ws, `C${r0}:E${r0}`); ws.getRow(r0).height = 32; r0 += 4;
    cell(ws, `C${r0}`, info.ten, { font: bold, align: AL.center }); merge(ws, `C${r0}:E${r0}`); r0 += 5;

    cell(ws, `A${r0}`, "3. Nhận xét, đánh giá và đề xuất mức xếp loại của cấp có thẩm quyền", { font: bold }); merge(ws, `A${r0}:E${r0}`); r0++;
    cell(ws, `A${r0}`, "- Chấm điểm: ……………….........………; Đề xuất xếp loại: ……………………………"); merge(ws, `A${r0}:E${r0}`); r0 += 2;
    cell(ws, `A${r0}`, "- Mức độ đáp ứng đối với các mục tiêu, nhiệm vụ then chốt: …………………………………………\n(Đánh giá rõ mức độ đáp ứng yêu cầu nhiệm vụ theo 3 mức: (1) Chủ động tiếp cận, giải quyết hiệu quả vấn đề, có kết quả cụ thể; (2) Cơ bản đáp ứng yêu cầu nhưng còn hạn chế, cần tiếp tục hoàn thiện; (3) Không đáp ứng yêu cầu nhiệm vụ)", { align: AL.wrap });
    merge(ws, `A${r0}:E${r0}`); ws.getRow(r0).height = 78; r0 += 3;
    cell(ws, `A${r0}`, "XÁC NHẬN CỦA BAN THƯỜNG VỤ CẤP UỶ\nhoặc TẬP THỂ LÃNH ĐẠO CƠ QUAN, ĐƠN VỊ\n(Xác lập thời điểm, ký, ghi rõ họ tên và đóng dấu)", { font: bold, align: AL.center });
    merge(ws, `A${r0}:E${r0}`); ws.getRow(r0).height = 50;

    const buf = await wb.xlsx.writeBuffer();
    return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  }

  G.Reports = { buildCbcc, buildKy, buildCv1619 };
})(window);
