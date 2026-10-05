THI ĐUA LỚP – bản FIXED

Lỗi màn hình “Đang tải giao diện” của bản trước do setupView() chỉ trả về chuỗi HTML nhưng boot() gọi rồi bỏ kết quả. Bản này setupView() tự render vào #root và bind lại các nút ở mọi bước của wizard.

Cấu trúc deploy bắt buộc:
index.html
scripts.js
styles.css
vercel.json
firebase-rules.json

Firebase config nằm trong firebase-config.js. Người dùng chỉ nhập tên tài khoản + mật khẩu; định danh kỹ thuật của Firebase Authentication không hiển thị hoặc yêu cầu từ người dùng.

Kiểm tra trước deploy:
- JavaScript syntax OK
- Firebase Rules JSON OK
- Boot render test OK
- Cache-busting/no-store cho index, JS, CSS


STUDENT IMPORT: không có giới hạn 24 học sinh; hỗ trợ Excel/CSV/chấm phẩy/dấu |; mã thiếu được tạo ổn định theo tên và tổ; mã trùng được cảnh báo và có hậu tố riêng; số học sinh được xác minh lại từ Firebase sau khi lưu.

Security Rules: chỉ tài khoản đang hoạt động mới thao tác; cán bộ chỉ sửa/xóa bản ghi do mình tạo (GVCN có ngoại lệ); tuần đã chốt từ chối thay đổi của cán bộ; audit là append-only; phản ánh phải có dữ liệu hợp lệ.

CẬP NHẬT (đổi chức vụ):
- GVCN vào tab Quản lý → nút "👥 Đổi chức vụ" cạnh "Chỉnh cấu trúc".
- Chọn học sinh mới cho Lớp trưởng, Lớp phó, Tổ trưởng, Tổ phó.
- Hệ thống cập nhật họ tên trên tài khoản cán bộ hiện có và tên trên cấu trúc tổ.
- Mật khẩu không đổi tự động; nếu giao cho người mới nên đổi mật khẩu qua Sửa tài khoản.

SỬA LỖI PHÂN QUYỀN (Firebase Rules):
- Node "weeks" và "reports" trước đây chỉ có .read ở cấp con ($week / $rid).
  Firebase RTDB từ chối đọc cả nhánh (PERMISSION_DENIED) → syncAll lỗi.
- Đã thêm .read ở cấp cha:
  • weeks: mọi tài khoản active được đọc
  • reports: chỉ GVCN được đọc danh sách
- Sau khi deploy code, BẮT BUỘC mở Firebase Console → Realtime Database → Rules
  → dán nội dung firebase-rules.json → Publish.


CẬP NHẬT (chấm chéo giữa các tổ):
- GVCN vào tab Thiết lập → thẻ "Chấm chéo giữa các tổ" → chọn chế độ → "Lưu chế độ chấm".
  • Tắt (mặc định): tổ nào chấm tổ đó như cũ.
  • Chấm chéo: tổ trưởng/tổ phó chỉ ghi điểm cho học sinh các tổ KHÁC, không chấm tổ mình.
  • Chấm tự do: tổ trưởng/tổ phó ghi điểm được cho mọi tổ.
- Lớp trưởng, lớp phó, GVCN vẫn chấm toàn lớp. Bản ghi cũ không bị thay đổi.
- Cấu hình lưu ở classConfig/crossGrading ("off" | "others" | "all").
- Firebase Rules đã cập nhật để chặn ở phía máy chủ (kể cả khi sửa mã trên trình duyệt), và kiểm tra
  studentGroup của bản ghi phải khớp với tổ thật của học sinh.
- BẮT BUỘC sau khi deploy: Firebase Console → Realtime Database → Rules → dán lại nội dung
  firebase-rules.json → Publish. Nếu quên, chế độ chấm chéo sẽ bị Rules cũ từ chối khi lưu bản ghi.
