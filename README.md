# Quản lý Công tác Cá nhân — bản web (GitHub Pages + Supabase)

Trang web tĩnh, không cần máy chủ riêng, không dùng Streamlit.
Dữ liệu nằm ở Supabase, đăng nhập bằng email + mật khẩu; báo cáo Word/Excel được tạo ngay trên trình duyệt.

## Bước 1 — Tạo dự án Supabase mới
1. Vào supabase.com/dashboard → **New project** (tên gợi ý `congviec-ca-nhan`, khu vực Singapore).
2. Vào **SQL Editor → New query**, dán toàn bộ file `sql/01_tao_bang_va_nap_du_lieu.sql` → **Run**.
   (Nếu bạn đã chạy file `supabase_congviec_moi.sql` gửi trước đó thì chạy thêm file `sql/02_siet_bao_mat_neu_da_chay_file_cu.sql` thay vì file 01.)
3. Vào **Authentication → Users → Add user → Create new user**: nhập email + mật khẩu của bạn, tích **Auto Confirm User**.
4. Vào **Authentication → Sign In / Providers**, tắt **Allow new users to sign up** (để không ai tự đăng ký được).
5. Vào **Project Settings → API**, chép **Project URL** và **anon public key**.

## Bước 2 — Đưa trang lên GitHub Pages
1. Tạo kho mới trên github.com (ví dụ `congviec`), chọn **Public**. Kho chỉ chứa mã trang web, không chứa dữ liệu công việc.
2. Bấm **Add file → Upload files**, kéo **toàn bộ nội dung** thư mục này (kể cả thư mục `css`, `js`, `vendor`, `assets`, file `index.html`, `manifest.webmanifest`, `.nojekyll`) rồi **Commit**.
3. Vào **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, thư mục `/ (root)` → **Save**.
4. Sau 1–2 phút, trang chạy tại `https://<tên-tài-khoản>.github.io/congviec/`.

## Bước 3 — Điền thông tin kết nối
Cách 1 (khuyên dùng): mở file `js/config.js` trên GitHub (biểu tượng bút chì), điền `SUPABASE_URL` và `SUPABASE_ANON_KEY`, Commit. Mọi thiết bị mở link đều dùng được ngay.
Cách 2: để trống, lần mở đầu tiên trên mỗi thiết bị trang sẽ hỏi hai giá trị này.

Không bao giờ dán `service_role key` vào trang web.

## Sử dụng
- Đăng nhập bằng email/mật khẩu đã tạo ở Bước 1.
- Trên điện thoại: mở link bằng Chrome/Safari → *Thêm vào màn hình chính* để dùng như ứng dụng.
- Cài đặt → **Tải bản sao lưu (.json)** định kỳ; có thể khôi phục từ chính file đó.

## Cấu trúc
- `index.html`, `css/style.css` — giao diện (đỏ – vàng – navy, nền sáng).
- `js/core.js` — hằng số, kỳ báo cáo, tính KPI CV 1619.
- `js/db.js` — kết nối Supabase (đăng nhập, bảng `tasks`, `next_week_tasks`, `config`).
- `js/reports.js` — xuất Word (docx.js) và Excel (ExcelJS).
- `js/app.js` — các trang. `vendor/` — thư viện đã đóng gói sẵn (không phụ thuộc CDN).
