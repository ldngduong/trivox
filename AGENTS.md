# Quy ước chung toàn dự án (Workspace Rules)

Tài liệu này áp dụng bắt buộc cho mọi thành phần trong workspace `c:/Work/threed`.

## 1. Quy tắc Copywriting & Nội dung hiển thị (Cấm tuyệt đối)

- **Cấm văn phong sáo rỗng, tự quảng cáo công nghệ:** Tuyệt đối không tạo các câu chữ vô nghĩa kiểu *"Tạo bởi sand3d"*, *"Dựng bằng code Python sand3d"*, *"bpy 4.5 • GLB Articulated"*, *"Powered by AI"*, hay các câu giới thiệu thừa thãi.
- **Cấm dấu ngoặc kép thừa và tên gọi rườm rà:** Không bọc nhãn giao diện trong ngoặc kép hoặc kèm chú thích tiếng Anh/tiếng Việt song ngữ lộn xộn kiểu `Cửa lồng giặt (Door Hinge)`. Dùng thuật ngữ ngắn gọn, chuẩn xác, đồng nhất một ngôn ngữ.
- **Chỉ hiển thị thông tin có giá trị thực:** Tên dự án/model, thông số kích thước, danh sách khớp chuyển động, trạng thái bước thực thi của Agent, và khung hội thoại.

## 2. Quy tắc Giao diện & Typography (`shadcn/ui` Dark Theme Elegant - Đen / Xám / Trắng)

- **Bắt buộc cài đặt bằng CLI chính thức:**
  - Mọi framework và thư viện UI (`shadcn/ui`, `NestJS`, `Vite React TS`) bắt buộc khởi tạo và cài đặt bằng CLI chính thức mới nhất (`npx shadcn@latest init`, `npx shadcn@latest add ...`, `npx @nestjs/cli@latest new ...`).
  - **CẤM** tự gõ tay giả lập các component của `shadcn/ui` hay khung sườn của NestJS. Luôn kiểm tra tài liệu CLI mới nhất trước khi chạy.
- **Tông màu Đen – Xám – Trắng thuần khiết (Monochrome Dark):**
  - Chỉ sử dụng bảng màu đen, xám, trắng (`zinc` / `neutral` dark của `shadcn/ui`): nền `#09090b`, khung `#121214` / `#18181b`, viền `#27272a`, chữ và nút chính màu trắng/xám sáng `#fafafa` / `#e4e4e7`, chữ phụ `#a1a1aa`.
  - **CẤM** pha tạp các màu xanh đỏ tím vàng sặc sỡ lên nút bấm, thanh trượt hay badge.
  - Đảm bảo **Responsive** hoàn chỉnh trên cả màn hình rộng (Desktop 3 cột) và màn hình nhỏ/tablet (chuyển tab/drawer mượt mà).
- **Cấm tuyệt đối các kiểu trang trí AI-slop & thuật ngữ gây rối:**
  - **CẤM** `uppercase` đi kèm `tracking-wider` / `letter-spacing` rộng ở tiêu đề mục, nhãn hoặc badge.
  - **CẤM** dùng `font-mono` cho số liệu, nhãn, badge hay văn bản giao diện.
  - **CẤM** dùng `gradient` (màu chuyển sắc) trên nền, nút bấm, thẻ, viền hoặc chữ.
  - **CẤM** dùng emoji (`✨`, `🚀`, `🤖`...) hoặc gắn icon đầu dòng cho mọi tiêu đề/mục nhỏ.
  - **CẤM** hiển thị thông số kỹ thuật nội bộ gây rối người dùng (như `s3d_joint`, `bpy 4.5`, `meshes count`, `GLB Articulated`, tên hàm code nội bộ). Ngôn ngữ hiển thị cho người dùng phải tự nhiên, ngắn gọn, dễ hiểu.

## 3. Kiến trúc Hệ thống & Quy chuẩn Tổ chức Mã nguồn (Production Stack)

- **Cấm tuyệt đối code inline (Zero Inline Types / Helpers / Utils):**
  - Mọi `interface`, `type`, `DTO`, `schema`, `constant`, `helper`, `utility` bắt buộc phải tách ra file riêng theo đúng chức năng (`types/`, `dto/`, `schemas/`, `utils/`, `constants/`). Không khai báo `interface`, `type`, hàm helper hay hằng số lẫn lộn ngay trong file Component, Controller hay Service.
- **Frontend (`/web`):**
  - Stack: React + Vite + TypeScript + Tailwind CSS + `shadcn/ui` + Three.js (`@react-three/fiber`, `@react-three/drei`) + `zustand` (quản lý state & Auth store) + `@tanstack/react-query` (data fetching & mutations) + `react-hook-form` + `zod` + `@hookform/resolvers`.
  - **Xác thực (Auth):** Xác thực qua **HTTP-Only Cookie** (`credentials: 'include'`) gọi tới API `/api/auth/*`. **CẤM** lưu token hay thông tin nhạy cảm vào `localStorage` hoặc `sessionStorage`.
  - Cấu trúc thư mục chuẩn: `src/pages/`, `src/features/`, `src/components/`, `src/stores/`, `src/services/`, `src/schemas/`, `src/types/`, `src/utils/`.
- **Backend API & Agent Orchestrator (`/api`):**
  - Stack: NestJS (TypeScript) + `class-validator` + `class-transformer` (bật `ValidationPipe` toàn cục với `whitelist: true, forbidNonWhitelisted: true, transform: true`) + `cookie-parser` (quản lý phiên đăng nhập qua HTTP-Only Cookie).
  - Chia tách rõ từng module (`src/modules/auth/`, `src/modules/agent/`, `src/modules/projects/`, `src/modules/database/`, `src/modules/storage/`) với các thư mục con chuẩn: `controllers/`, `services/`, `dto/`, `interfaces/`, `constants/`, `guards/`, `utils/`.
- **Python Geometry Engine (`/cad-worker`):**
  - Stack: FastAPI + Pydantic v2 chạy trên `.venv` (`sand3d` + `bpy`).
  - Chia tách cấu trúc thư mục rõ ràng: `app/routers/`, `app/schemas/`, `app/services/`, `app/utils/`, `app/constants/`.
