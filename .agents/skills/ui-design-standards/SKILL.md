---
name: ui-design-standards
description: >-
  Enforces strict shadcn/ui dark theme standards and Coding IDE agent UX.
  Activate whenever building or modifying React frontend components, layouts,
  chat interfaces, or styling.
---

# Chuẩn thiết kế giao diện (`shadcn/ui` Dark & Coding IDE UX)

## 1. Các quy tắc cấm tuyệt đối (Zero-Tolerance Bans)

1. **Không `uppercase` + `tracking-wider`:** Mọi tiêu đề nhóm, label, tab, badge đều viết hoa chữ cái đầu tự nhiên (Sentence case), `letter-spacing` mặc định (`normal` hoặc `-0.01em`).
2. **Không `font-mono` tràn lan:** Toàn bộ UI, số đo thanh trượt, badge, thông số dùng font sans-serif (`Inter` / hệ thống) với `font-variant-numeric: tabular-nums`. Chỉ dùng monospace bên trong khung xem code thực sự.
3. **Không `gradient`:** Không dùng `linear-gradient` hay `radial-gradient` trên nút bấm, nền card, viền hay chữ. Chỉ dùng màu đơn sắc phẳng (`solid`) kết hợp viền `1px solid #27272a`.
4. **Không Emoji & không lạm dụng Icon:** Tuyệt đối không chèn emoji vào UI. Không đặt icon trang trí trước mỗi tiêu đề section.
5. **Không câu chữ sáo rỗng (Filler copy):** Không ghi các câu giới thiệu công nghệ (*"Tạo bởi sand3d"*, *"AI 3D Generator"*...), không đặt từ trong dấu ngoặc kép vô nghĩa.

## 2. Bố cục chuẩn Coding IDE (3-Pane Studio Layout)

- **Left / Inspector Pane (`260px - 280px`):** Danh sách cấu trúc bộ phận (Scene Tree / Parts) và bảng điều khiển khớp động (Joint Controls) hiển thị gọn như bảng thuộc tính của IDE/CAD.
- **Center Viewport (`flex-1`):** Không gian 3D Three.js sắc nét, thanh công cụ góc nhìn nhỏ gọn nổi ở cạnh dưới hoặc góc trên, không che khuất tầm nhìn.
- **Right Agent Pane (`360px - 400px`):** Giao diện Chat Agent chuẩn Coding IDE:
  - Lịch sử hội thoại phân tách rõ yêu cầu người dùng và phản hồi của Agent.
  - Các bước gọi Tool (`inspect_image`, `write_model_code`, `compile_glb`) hiển thị dạng dòng trạng thái gọn (1 dòng, bấm vào mới mở chi tiết log/code).
  - Ô nhập prompt ở dưới cùng hỗ trợ kéo-thả/dán ảnh tham chiếu, phím tắt `Enter` gửi, `Shift + Enter` xuống dòng.
