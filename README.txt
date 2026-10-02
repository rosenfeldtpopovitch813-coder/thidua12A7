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
