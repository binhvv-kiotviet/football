# ⚽ Chia đội bóng

Web chia đội bóng đá hàng tuần: quản lý thành viên, điểm danh, chia đội cân bằng tự động, lưu lịch sử.

- **Admin** (đăng nhập bằng mật khẩu): quản lý thành viên, vị trí, chỉ số; tạo buổi đá; điểm danh; chia đội; chốt đội.
- **Mọi người** (không cần đăng nhập): trang chủ xem đội buổi tới, lịch sử chia đội và thẻ cầu thủ kiểu FIFA.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000. Không cần cài database: khi không có `DATABASE_URL`, app tự dùng Postgres nhúng (PGlite), dữ liệu lưu trong thư mục `.data/`. Mật khẩu admin mặc định khi chạy local là `admin`.

## Deploy lên Vercel (miễn phí)

1. Đẩy code lên GitHub.
2. Vào https://vercel.com/new, chọn repo vừa đẩy → **Deploy** (lần đầu sẽ lỗi khi mở trang vì chưa có DB, không sao).
3. Trong project trên Vercel: tab **Storage** → **Create Database** → chọn **Neon** (Postgres, gói Free) → **Connect** vào project. Vercel tự thêm biến `DATABASE_URL`.
4. Tab **Settings → Environment Variables**: thêm `ADMIN_PASSWORD` = mật khẩu admin bạn muốn.
5. Tab **Deployments** → **Redeploy** bản mới nhất.

Bảng dữ liệu được tự tạo ở lần truy cập đầu tiên, không cần chạy migration.

> Muốn dùng chung DB Neon khi chạy local: tạo file `.env.local` với `DATABASE_URL=...` (copy từ Vercel) và `ADMIN_PASSWORD=...`.

## Cách dùng hằng tuần

1. **Quản trị → Thành viên**: thêm người, vị trí chính/phụ, 6 chỉ số kiểu FIFA (1–99). Chỉ số tổng (OVR) tự tính theo vị trí.
2. **Quản trị → Buổi đá → Tạo buổi**: ngày mặc định là ngày đá tiếp theo theo cài đặt (mặc định Thứ 5).
3. Tích **điểm danh** những người đi, thêm **khách vãng lai** nếu có.
4. Bấm **Chia đội tự động**; không ưng thì **Chia lại**, hoặc chuyển từng người bằng ô chọn đội.
5. **Chốt đội** → trang chủ hiện đội cho mọi người xem, bấm **Sao chép để gửi nhóm** để dán vào Zalo.

## Chỉ số kiểu FIFA

- Cầu thủ: PAC (tốc độ), SHO (sút), PAS (chuyền), DRI (rê bóng), DEF (phòng ngự), PHY (thể lực).
- Thủ môn: DIV (đổ người), HAN (bắt bóng), KIC (phát bóng), REF (phản xạ), SPD (tốc độ), POS (chọn vị trí).
- OVR = trung bình có trọng số theo vị trí (xem `src/lib/stats.ts`). Thẻ vàng ≥ 75, bạc 65–74, đồng < 65.
- Danh sách cầu thủ tạo sẵn ở lần chạy đầu nằm trong `src/lib/seed.ts`.

## Thuật toán chia đội

1. Mỗi đội 1 thủ môn (nếu đủ), thủ môn dư đá như cầu thủ thường.
2. Rải đều từng vị trí (hậu vệ, tiền vệ, tiền đạo), số người các đội chênh nhau tối đa 1.
3. Đổi chéo cầu thủ cùng vị trí để tổng chỉ số các đội gần nhau nhất.
4. Chạy nhiều lần ngẫu nhiên, chọn ngẫu nhiên trong các phương án tốt nhất, nên mỗi lần chia lại ra đội khác.

Chỉ số và vị trí được lưu lại tại thời điểm đá, nên sửa chỉ số sau này không làm thay đổi lịch sử.

## Cấu trúc

- `src/lib/db.ts`: kết nối DB (Neon / PGlite) và tạo bảng
- `src/lib/data.ts`: đọc dữ liệu
- `src/lib/actions.ts`: server actions (đều kiểm tra quyền admin)
- `src/lib/split.ts`: thuật toán chia đội
- `src/app/`: các trang (`/`, `/history`, `/sessions/[id]`, `/admin/...`)
