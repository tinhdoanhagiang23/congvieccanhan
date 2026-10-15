/* Hằng số, tiện ích ngày tháng và logic tính toán (KPI CV 1619, kỳ báo cáo).
   Không phụ thuộc giao diện — dùng chung cho app và phần xuất báo cáo. */
(function (G) {
  "use strict";

  const LOAI_CV = [
    "Tham mưu văn bản", "Xây dựng ứng dụng chuyển đổi số", "Họp Ban", "Họp Chi bộ",
    "Họp chuyên môn", "Công tác trong tỉnh", "Công tác ngoài tỉnh", "Dự tập huấn",
    "Giao dịch với đơn vị ngoài cơ quan", "Khác",
  ];
  const TRANG_THAI = ["Chưa thực hiện", "Đang thực hiện", "Hoàn thành", "Trễ hạn"];
  const UU_TIEN = ["Cao", "Bình thường", "Thấp"];
  const VN_THU = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];

  const TRUC_LIST = ["Trục 1", "Trục 2", "Trục 3", "Trục 4", "Trục 5", "Trục 6"];
  const TRUC_TEN = {
    "Trục 1": "Kết quả thực hiện nhiệm vụ chính trị và phát triển kinh tế - xã hội",
    "Trục 2": "Xây dựng hoàn thiện thể chế, tổ chức thực thi và phân cấp, phân quyền",
    "Trục 3": "Phát triển khoa học, công nghệ, đổi mới sáng tạo, chuyển đổi số và dữ liệu",
    "Trục 4": "Xây dựng Đảng, hệ thống chính trị, tổ chức bộ máy, đội ngũ cán bộ và liêm chính",
    "Trục 5": "Phục vụ nhân dân, phát triển con người, văn hóa và xã hội",
    "Trục 6": "Thực hiện nhiệm vụ quốc phòng, an ninh, đối ngoại và hội nhập quốc tế",
  };
  const TRUC_DIEM_KHOI_DANG = { "Trục 1": 30, "Trục 2": 15, "Trục 3": 5, "Trục 4": 40, "Trục 5": 5, "Trục 6": 5 };
  const NHOM_AB = ["A - Nhiệm vụ thường xuyên", "B - Nhiệm vụ trọng tâm, then chốt"];
  const NHOM_SHORT = { [NHOM_AB[0]]: "A – Thường xuyên", [NHOM_AB[1]]: "B – Trọng tâm" };
  const NHOM_KHO_LIST = ["N1", "N2", "N3", "N4", "N5"];
  const NHOM_KHO_DIEM = { N1: 20, N2: 40, N3: 60, N4: 80, N5: 100 };
  const NHOM_KHO_HESO = { N1: 1, N2: 2, N3: 3, N4: 4, N5: 5 };
  const NHOM_KHO_GOI_Y = {
    N1: "Đơn giản — quy trình rõ, có biểu mẫu/quy định sẵn",
    N2: "Trung bình — chuyên môn theo quy định/hướng dẫn đã có",
    N3: "Khá khó — cần phân tích, tổng hợp, phối hợp",
    N4: "Khó, phức tạp — nhiều yếu tố, chưa có đầy đủ hướng dẫn",
    N5: "Rất khó/then chốt — mới, chưa có tiền lệ, cần đột phá",
  };
  const HE_SO_CL_OPTS = [
    ["Hoàn thành và vượt chỉ tiêu / SP được chấp nhận ngay", 1.0],
    ["Hoàn thành 80-99% / SP cơ bản đáp ứng, chỉnh sửa nhỏ", 0.75],
    ["Hoàn thành 60-79% / SP phải chỉnh sửa nội dung cơ bản", 0.5],
    ["Hoàn thành 50-59% / SP có sai sót nghiêm trọng", 0.25],
    ["Hoàn thành dưới 50% / SP không đạt yêu cầu", 0.0],
  ];
  const MAUDG_TIEUCHI = [
    [1, "Về phẩm chất chính trị, đạo đức, lối sống, thực hiện trách nhiệm nêu gương", [
      "1.1. Tuyệt đối trung thành với Đảng, Tổ quốc và Nhân dân; kiên định chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, mục tiêu độc lập dân tộc và chủ nghĩa xã hội. Có lập trường, quan điểm, bản lĩnh chính trị vững vàng; kiên quyết bảo vệ nền tảng tư tưởng, Cương lĩnh chính trị, đường lối của Đảng, Hiến pháp, pháp luật của Nhà nước; đấu tranh phản bác các quan điểm sai trái, thù địch, các biểu hiện suy thoái, \"tự diễn biến\", \"tự chuyển hoá\".",
      "1.2. Có tinh thần yêu nước sâu sắc, tận tuỵ phục vụ Nhân dân, sâu sát cơ sở, luôn hành động vì lợi ích của Nhân dân. Đặt lợi ích của Đảng, quốc gia - dân tộc, Nhân dân, tập thể lên trên lợi ích cá nhân, sẵn sàng hy sinh vì sự nghiệp cách mạng của Đảng, vì độc lập, tự do của Tổ quốc, vì hạnh phúc của Nhân dân.",
      "1.3. Chấp hành nghiêm chủ trương, đường lối, nghị quyết, chỉ thị, quy định, nguyên tắc tổ chức, kỷ luật của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình; chấp hành nghiêm pháp luật của Nhà nước và quy định của cơ quan, đơn vị. Tuyệt đối chấp hành sự phân công của tổ chức, yên tâm công tác và hoàn thành tốt mọi nhiệm vụ được giao.",
      "1.4. Có tinh thần tự giác, trách nhiệm cao trong nghiên cứu, học tập chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, các nghị quyết, chỉ thị của Đảng và các chương trình bồi dưỡng, cập nhật kiến thức mới nhằm nâng cao trình độ về mọi mặt, đáp ứng yêu cầu, nhiệm vụ.",
      "1.5. Có phẩm chất đạo đức, lối sống trong sáng, trung thực, khiêm tốn, chân thành, giản dị; cần, kiệm, liêm, chính, chí công vô tư; chấp hành nghiêm quy định về chuẩn mực đạo đức cách mạng của cán bộ, đảng viên trong giai đoạn mới, trách nhiệm nêu gương; không vi phạm Quy định về những điều đảng viên không được làm. Không né tránh công việc, chạy theo thành tích; không vi phạm đạo đức, lối sống đến mức bị xử lý kỷ luật.",
      "1.6. Không tham vọng quyền lực; không chạy chức, chạy quyền; không tham nhũng, lãng phí, cơ hội, vụ lợi, cục bộ, lợi ích nhóm; không để gia đình, người thân và người khác lợi dụng chức vụ, vị trí công tác để trục lợi. Không có biểu hiện suy thoái về tư tưởng chính trị, đạo đức, lối sống, những biểu hiện \"tự diễn biến\", \"tự chuyển hoá\" trong nội bộ. Kiên quyết đấu tranh chống quan liêu, cửa quyền, tham nhũng, xa hoa, lãng phí, tiêu cực, chủ nghĩa cá nhân, lối sống cơ hội, thực dụng, bè phái, lợi ích nhóm, nói không đi đôi với làm.",
      "1.7. Có uy tín cao, tiêu biểu về phẩm chất đạo đức và phong cách công tác; là trung tâm đoàn kết, thương yêu đồng chí, đồng nghiệp.",
      "1.8. Có tinh thần chủ động, đổi mới sáng tạo; phấn đấu vì mục tiêu phát triển của cơ quan, đơn vị, đóng góp vào mục tiêu chung của đất nước.",
      "1.9. Thực hiện việc kê khai và công khai tài sản, thu nhập theo quy định. Báo cáo đầy đủ, trung thực, cung cấp thông tin chính xác, khách quan về những nội dung liên quan đến việc thực hiện chức trách, nhiệm vụ được giao và hoạt động của cơ quan, tổ chức, đơn vị với cấp trên khi được yêu cầu.",
    ]],
    [2, "Tư duy đổi mới, chiến lược, khát vọng cống hiến, dám nghĩ, dám làm", [
      "2.1. Có tư duy đổi mới, tầm nhìn chiến lược, khả năng lãnh đạo, chỉ đạo thích ứng với sự phát triển của thời đại và xu thế toàn cầu hoá; phương pháp làm việc khoa học, nhạy bén chính trị; có năng lực cụ thể hoá trong lãnh đạo, chỉ đạo cơ quan, đơn vị thực hiện và hoàn thành tốt chức năng, nhiệm vụ được giao.",
      "2.2. Luôn bám sát thực tiễn, có nhiều cách làm hay, sáng tạo, đạt hiệu quả cao trong lãnh đạo, chỉ đạo, tổ chức thực hiện nhiệm vụ; xây dựng cấp uỷ, tổ chức đảng trong sạch, vững mạnh, cơ quan, đơn vị vững mạnh toàn diện.",
      "2.3. Nói đi đôi với làm, dám nghĩ, dám làm, dám chịu trách nhiệm, dám đột phá vì lợi ích chung. Có khả năng phân tích, dự báo tình hình, phát hiện những khó khăn, bất cập, thời cơ, thuận lợi trong thực tiễn; đề xuất hoặc quyết định những giải pháp phù hợp, kịp thời, hiệu quả.",
      "2.4. Có khát vọng phấn đấu, cống hiến; có khả năng quy tụ và phát huy được sức mạnh của tập thể, cá nhân trong cơ quan, đơn vị và các cơ quan, đơn vị có liên quan.",
    ]],
    [3, "Về tự phê bình và phê bình, tự soi, tự sửa, khắc phục hạn chế, khuyết điểm", [
      "3.1. Chủ động, nghiêm túc thực hiện tự phê bình và phê bình, có tinh thần cầu thị và tiếp thu phản biện, góp ý.",
      "3.2. Có kế hoạch rõ ràng, quyết liệt trong khắc phục hạn chế, khuyết điểm đã được chỉ ra.",
      "3.3. Kết quả khắc phục hoàn thành từ ≥ 80% nội dung, có tiến bộ rõ, được tổ chức đánh giá tốt; không để tái diễn tồn tại.",
      "3.4. Tự soi, tự sửa trên tinh thần trách nhiệm chính trị cao, không né tránh, không đổ lỗi.",
    ]],
  ];
  const XL_MUC = ["Tự động (theo kết quả)", "Hoàn thành xuất sắc nhiệm vụ", "Hoàn thành tốt nhiệm vụ",
    "Hoàn thành nhiệm vụ", "Không hoàn thành nhiệm vụ"];
  const KY_LOAI = ["Tuần", "Tháng", "Quý", "6 tháng đầu năm", "9 tháng đầu năm", "Năm", "Tùy chọn"];

  // ── Ngày tháng (toàn bộ dùng chuỗi ISO yyyy-mm-dd, tính theo giờ địa phương) ──
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const fmtD = (s) => { const d = typeof s === "string" ? parseISO(s) : s; return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` : (s || ""); };
  const weekday = (d) => (d.getDay() + 6) % 7; // Thứ Hai = 0
  const daysBetween = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
  const lastDay = (y, m) => new Date(y, m, 0).getDate();
  function isoWeek(d) { // [tuần, năm] theo chuẩn ISO-8601
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dn = (t.getUTCDay() + 6) % 7;
    t.setUTCDate(t.getUTCDate() - dn + 3);
    const y = t.getUTCFullYear();
    const first = new Date(Date.UTC(y, 0, 4));
    const w = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
    return [w, y];
  }
  const mondayOf = (d) => addDays(d, -weekday(d));
  function noiNgay(d, diaDanh) {
    const s = `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
    return diaDanh ? `${diaDanh}, ${s}` : s[0].toUpperCase() + s.slice(1);
  }

  /** Trả về {tu, den, nhan} cho các loại kỳ báo cáo. */
  function kyRange(loai, o) {
    const t = today();
    const nam = o.nam || t.getFullYear();
    if (loai === "Tuần") {
      const d = o.ngay || t, tu = mondayOf(d), den = addDays(tu, 6), [w, y] = isoWeek(tu);
      return { tu, den, nhan: `Tuần ${w}/${y}` };
    }
    if (loai === "Tháng") {
      const m = o.thang || t.getMonth() + 1;
      return { tu: new Date(nam, m - 1, 1), den: new Date(nam, m - 1, lastDay(nam, m)), nhan: `Tháng ${pad(m)}/${nam}` };
    }
    if (loai === "Quý") {
      const q = o.quy || Math.floor(t.getMonth() / 3) + 1;
      return { tu: new Date(nam, (q - 1) * 3, 1), den: new Date(nam, q * 3 - 1, lastDay(nam, q * 3)),
        nhan: "Quý " + ["I", "II", "III", "IV"][q - 1] + `/${nam}` };
    }
    if (loai === "6 tháng đầu năm") return { tu: new Date(nam, 0, 1), den: new Date(nam, 5, 30), nhan: `6 tháng đầu năm ${nam}` };
    if (loai === "9 tháng đầu năm") return { tu: new Date(nam, 0, 1), den: new Date(nam, 8, 30), nhan: `9 tháng đầu năm ${nam}` };
    if (loai === "Năm") return { tu: new Date(nam, 0, 1), den: new Date(nam, 11, 31), nhan: `Năm ${nam}` };
    return { tu: o.tu, den: o.den, nhan: o.nhan || "kỳ báo cáo" };
  }

  // ── Logic CV 1619 ──
  const TRUC_TU_KHOA = [
    ["Trục 3", ["ứng dụng", "app", "phần mềm", "chuyển đổi số", "công nghệ", "chat ai", "trí tuệ nhân tạo",
      "zalo mini app", "website", "trang thông tin điện tử", "hệ thống", "máy tính", "mạng", "dữ liệu",
      "cài đặt", "sửa máy", "bản quyền", "chatbot", "kết nối điểm cầu", "kỹ thuật", "đường truyền",
      "phòng họp không giấy", "cabinet", "sotaydangvien", "an toàn thông tin"]],
    ["Trục 4", ["nâng lương", "phụ cấp", "chi bộ", "đảng viên", "sinh hoạt đảng", "cán bộ, công chức", "cbcc",
      "tổ chức bộ máy", "bàn giao chức năng", "nghị quyết số 57", "nghị quyết 57", "kiểm tra, giám sát",
      "biên bản họp xét", "nhân sự", "quy định số 211", "quy chế làm việc", "thâm niên"]],
    ["Trục 6", ["đoàn công tác", "châu ủy", "đối ngoại", "quốc phòng", "an ninh", "biên giới", "hội nhập quốc tế"]],
    ["Trục 5", ["du lịch", "khảo sát", "nhân dân", "văn hóa", "đời sống"]],
    ["Trục 1", ["hội nghị", "tập huấn", "sơ kết", "tổng kết", "báo cáo công tác", "tuyên giáo", "dân vận",
      "quán triệt", "tuyên truyền", "đăng tin bài", "fanpage", "khẩu hiệu chào mừng"]],
  ];
  function goiYTruc(title) {
    const t = (title || "").toLowerCase();
    for (const [truc, kws] of TRUC_TU_KHOA) if (kws.some((k) => t.includes(k))) return truc;
    return "Trục 2";
  }

  /** Hệ số tiến độ: ≤ hạn = 1; chậm N ngày = 1 − 0,05N; chậm > 10 ngày hoặc chưa hoàn thành = 0. */
  function qTienDo(thoiHan, ngayHT) {
    if (!ngayHT) return 0;
    if (!thoiHan) return 1;
    const h = parseISO(thoiHan), k = parseISO(ngayHT);
    if (!h || !k) return 1;
    const cham = daysBetween(h, k);
    if (cham <= 0) return 1;
    if (cham > 10) return 0;
    return Math.round(Math.max(0, 1 - 0.05 * cham) * 100) / 100;
  }
  const nz = (v, d) => (v === null || v === undefined || v === "" ? d : Number(v));

  /** Tính từng dòng + KPI nhóm. Trả {kpi, tongJ, tongM, tongO, tongR, rows}. */
  function tinhKpi(tasks) {
    let tongJ = 0, tongM = 0, tongO = 0, tongR = 0;
    const rows = tasks.map((t) => {
      const nk = t.nhom_kho || "N2";
      const j = NHOM_KHO_HESO[nk] || 2;
      const e = nz(t.so_luong_ke_hoach, 1) || 1;
      const k = t.so_luong_thuc_te !== null && t.so_luong_thuc_te !== undefined && t.so_luong_thuc_te !== ""
        ? Number(t.so_luong_thuc_te) : (t.trang_thai === "Hoàn thành" ? e : 0);
      const l = e ? k / e : 0;
      const m = j * l;
      const n = nz(t.he_so_chat_luong, 1);
      const o = m * n;
      const q = qTienDo(t.thoi_han_vb, t.trang_thai === "Hoàn thành" ? t.ngay_kt : null);
      const r = m * q;
      tongJ += j; tongM += m; tongO += o; tongR += r;
      return { t, nk, j, e, k, l, m, n, o, q, r };
    });
    const kpi = tongJ === 0 ? 0 : (tongM / tongJ + tongO / tongJ + tongR / tongJ) / 3;
    return { kpi, tongJ, tongM, tongO, tongR, rows };
  }
  const xepLoaiTheoDiem = (d) => (d >= 90 ? 0 : d >= 75 ? 1 : d >= 50 ? 2 : 3);

  function tinhToanKy(tasks, xlChon) {
    const tong = tasks.length;
    const ht = tasks.filter((t) => t.trang_thai === "Hoàn thành").length;
    const tre = tasks.filter((t) => t.trang_thai === "Trễ hạn").length;
    const dang = tasks.filter((t) => t.trang_thai === "Đang thực hiện").length;
    const pt = tong ? Math.round((ht / tong) * 100) : 0;
    const theoLoai = {};
    tasks.forEach((t) => { const k = t.loai || "Khác"; theoLoai[k] = (theoLoai[k] || 0) + 1; });
    const noiBat = tasks.filter((t) => t.loai === "Xây dựng ứng dụng chuyển đổi số" && t.trang_thai === "Hoàn thành");
    let xl;
    if (xlChon === XL_MUC[0]) {
      if (!tong) xl = "Chưa có dữ liệu để đánh giá";
      else if (pt === 100 && tre === 0 && noiBat.length) xl = "Hoàn thành xuất sắc nhiệm vụ";
      else if (pt >= 90 && tre === 0) xl = "Hoàn thành tốt nhiệm vụ";
      else if (pt >= 70) xl = "Hoàn thành nhiệm vụ";
      else xl = "Không hoàn thành nhiệm vụ";
    } else xl = xlChon;
    const canCu = `hoàn thành ${ht}/${tong} công việc được giao, đạt tỷ lệ ${pt}%`
      + (tre ? `; còn ${tre} việc trễ hạn` : "; không có việc trễ hạn")
      + (noiBat.length ? `. Trong kỳ có ${noiBat.length} sản phẩm/giải pháp ứng dụng công nghệ thông tin được xây dựng và đưa vào sử dụng hiệu quả.` : ".");
    return { tasks, tong, ht, tre, dang, pt, theoLoai, noiBat, xepLoai: xl, canCu };
  }

  G.Core = {
    LOAI_CV, TRANG_THAI, UU_TIEN, VN_THU, TRUC_LIST, TRUC_TEN, TRUC_DIEM_KHOI_DANG, NHOM_AB, NHOM_SHORT,
    NHOM_KHO_LIST, NHOM_KHO_DIEM, NHOM_KHO_HESO, NHOM_KHO_GOI_Y, HE_SO_CL_OPTS, MAUDG_TIEUCHI, XL_MUC, KY_LOAI,
    pad, iso, parseISO, today, addDays, fmtD, weekday, daysBetween, lastDay, isoWeek, mondayOf, noiNgay, kyRange,
    goiYTruc, qTienDo, tinhKpi, xepLoaiTheoDiem, tinhToanKy,
  };
})(typeof window !== "undefined" ? window : globalThis);
