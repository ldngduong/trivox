---
name: sand3d-modeling
description: >-
  Guide and runbook for generating, validating, and compiling parametric 3D models
  with sand3d and bpy inside the Python CAD Worker service. Activate when writing
  sand3d prompts, AST sandboxes, or Python geometry compilation pipelines.
---

# Quy trình dựng hình và biên dịch `sand3d`

## 1. Tài liệu tham chiếu API

- Đọc [sand3d_api.md](../../../sand3d_api.md) khi cần tra cứu đầy đủ chữ ký hàm của `sand3d` (~3.600 token).
- Dùng đúng quy ước `import sand3d as s3d`, đơn vị mặc định `mm`, trả về `s3d.assembly(...)` hoặc đối tượng gốc và xuất bằng `s3d.export(root, path)`.

## 2. Quy tắc an toàn khi chạy trên Server (Ubuntu / Windows Worker)

1. **Kiểm tra AST trước khi thực thi:**
   - Chỉ cho phép import: `sand3d`, `math`.
   - Cấm tuyệt đối: `os`, `sys`, `subprocess`, `shutil`, `socket`, `pathlib`, `open`, `eval`, `exec`, `__import__`.
2. **Cô lập tiến trình (`subprocess`):**
   - `bpy` giữ trạng thái scene toàn cục trong process. Mỗi yêu cầu biên dịch `.glb` phải chạy trong một worker process độc lập hoặc chạy `s3d.empty_scene()` trong worker tuần tự có khóa và timeout cứng (`15s`).
3. **Vòng lặp tự sửa lỗi (Self-Healing Loop):**
   - Nếu quá trình thực thi ném `ValueError` hoặc `TypeError` từ `sand3d`, thu thập traceback ngắn gọn trả về cho DeepSeek Agent tự sửa code trước khi kết thúc lượt phản hồi.
