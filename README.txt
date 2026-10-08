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


CẬP NHẬT (chấm chéo giữa các tổ – GVCN chỉ định):
- GVCN vào tab Quản lý (đầu trang) → thẻ "Chấm chéo giữa các tổ":
  • Trạng thái: Tắt / Bật.
  • Với mỗi tổ, chọn tổ sẽ chấm (1 trong các tổ còn lại) hoặc "Tổ mình (không đổi)".
  • Nút "Gợi ý xoay vòng": 1→2→3→…→1 rồi chỉnh tay nếu cần.
  • Bấm "Lưu phân công chấm". Hệ thống cảnh báo nếu có tổ chưa ai chấm hoặc bị nhiều tổ cùng chấm.
- Khi bật, tổ trưởng/tổ phó chỉ ghi điểm cho học sinh của tổ được chỉ định (không chấm tổ mình).
- Lớp trưởng, lớp phó, GVCN vẫn chấm toàn lớp. Bản ghi cũ không đổi.
- Dữ liệu: classConfig/crossGrading ("off"|"assigned") và classConfig/crossTargets {"1":"2",...}.
- Firebase Rules đã cập nhật để chặn ở phía máy chủ. BẮT BUỘC sau khi deploy: Firebase Console →
  Realtime Database → Rules → dán lại firebase-rules.json → Publish.


CẬP NHẬT (GVCN đổi mật khẩu từng tài khoản):
- Trong Quản lý → Tài khoản, mỗi tài khoản khác GVCN có nút “🔑 Mật khẩu”.
- Mật khẩu mới được đổi qua Firebase Authentication bằng API server, không lưu mật khẩu vào Realtime Database.
- API dùng Firebase Admin SDK và xác minh ID token của người đang đăng nhập; chỉ GVCN active mới được reset. Firebase Admin SDK yêu cầu môi trường Node.js 22+.
- Vercel bắt buộc có Environment Variables:
  • FIREBASE_SERVICE_ACCOUNT_JSON = toàn bộ nội dung JSON Service Account Firebase.
  • FIREBASE_DATABASE_URL = https://chamdiem12a7-default-rtdb.asia-southeast1.firebasedatabase.app
- Sau khi thêm biến môi trường, Redeploy Vercel.
- Sau khi đổi, phiên đăng nhập của tài khoản đích sẽ bị thu hồi refresh token để buộc dùng mật khẩu mới.

CẬP NHẬT v6 — PHÂN QUYỀN CHỨC VỤ
- GVCN có thể tạo chức vụ tùy chỉnh với: tên chức vụ, phạm vi (toàn lớp/theo tổ/chỉ xem), và quyền điểm cộng, điểm trừ hoặc cả hai.
- Chức vụ tùy chỉnh có thể sửa/xóa; không thể xóa khi đang có tài khoản sử dụng.
- Nút Điểm cộng/Điểm trừ và kiểm tra quyền sửa/xóa bản ghi được áp dụng theo permission của chức vụ.
- Firebase Rules đã cập nhật để kiểm soát quyền cộng/trừ của chức vụ tùy chỉnh ở backend.
