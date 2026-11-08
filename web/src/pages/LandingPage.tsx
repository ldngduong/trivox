import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Box,
  Download,
  ImagePlus,
  Layers,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import {
  LANDING_ECOSYSTEM_ITEMS,
  LANDING_PILLARS,
} from '@/constants/studio.constants';

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  const primaryHref = user ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col selection:bg-zinc-200 selection:text-zinc-950">
      <header className="w-full h-16 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/trivox_logo.png"
            alt="Trivox"
            className="h-7 w-7 object-contain"
          />
          <span className="text-base font-semibold text-zinc-100">Trivox</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs text-zinc-400">
          <a href="#overview" className="hover:text-zinc-100 transition-colors">
            Tổng quan
          </a>
          <a href="#workflow" className="hover:text-zinc-100 transition-colors">
            Quy trình
          </a>
          <a href="#workspace" className="hover:text-zinc-100 transition-colors">
            Không gian làm việc
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <Button
              asChild
              size="sm"
              className="h-9 px-5 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
            >
              <Link to="/dashboard">Mở Studio</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-9 px-4 rounded-full text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 text-xs"
              >
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 px-5 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
              >
                <Link to="/register">Bắt đầu</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden border-b border-zinc-900 pt-16 pb-14 lg:pt-24 lg:pb-20">
          {/* Architectural Monochrome Contour & Horizon SVG */}
          <svg
            viewBox="0 0 1600 680"
            fill="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
            preserveAspectRatio="none"
          >
            {/* Left sweeping contour lines */}
            <path
              d="M-60 40 C 180 120, 260 390, 620 430"
              stroke="#27272a"
              strokeWidth="1.2"
            />
            <path
              d="M-60 95 C 165 165, 250 405, 620 438"
              stroke="#27272a"
              strokeWidth="1"
            />
            <path
              d="M-60 150 C 150 215, 240 420, 620 446"
              stroke="#18181b"
              strokeWidth="1"
            />
            <path
              d="M-60 210 C 140 265, 230 432, 620 454"
              stroke="#18181b"
              strokeWidth="1"
            />

            {/* Right sweeping contour lines */}
            <path
              d="M1660 40 C 1420 120, 1340 390, 980 430"
              stroke="#27272a"
              strokeWidth="1.2"
            />
            <path
              d="M1660 95 C 1435 165, 1350 405, 980 438"
              stroke="#27272a"
              strokeWidth="1"
            />
            <path
              d="M1660 150 C 1450 215, 1360 420, 980 446"
              stroke="#18181b"
              strokeWidth="1"
            />
            <path
              d="M1660 210 C 1460 265, 1370 432, 980 454"
              stroke="#18181b"
              strokeWidth="1"
            />

            {/* Horizon line */}
            <line
              x1="0"
              y1="440"
              x2="1600"
              y2="440"
              stroke="#27272a"
              strokeWidth="1"
            />

            {/* Perspective radial floor lines */}
            {[
              -760, -600, -460, -340, -230, -135, -45, 45, 135, 230, 340, 460,
              600, 760,
            ].map((offset, idx) => (
              <line
                key={idx}
                x1="800"
                y1="440"
                x2={800 + offset * 1.35}
                y2="680"
                stroke="#18181b"
                strokeWidth="1"
              />
            ))}
          </svg>

          <div className="relative z-10 w-full px-6 lg:px-12 flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-zinc-100 leading-[1.12] max-w-3xl">
              Dựng mô hình 3D từ ảnh và ngôn ngữ tự nhiên.
            </h1>

            <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-xl">
              Tách rời từng bộ phận. Có khớp chuyển động. Sửa tiếp trên Blender.
            </p>

            <div className="mt-8">
              <Button
                asChild
                className="h-11 px-7 rounded-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs sm:text-sm font-medium"
              >
                <Link to={primaryHref}>
                  {user ? 'Vào bảng điều khiển' : 'Mở Trivox Studio'}
                </Link>
              </Button>
            </div>

            {/* Center Emblem on Horizon */}
            <div className="mt-14 mb-12 flex flex-col items-center">
              <div className="h-20 w-20 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 flex items-center justify-center shadow-2xl">
                <img
                  src="/trivox_logo.png"
                  alt="Trivox"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Format & Engine Bar */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-xs sm:text-sm font-medium text-zinc-400">
              {LANDING_ECOSYSTEM_ITEMS.map((item) => (
                <span
                  key={item}
                  className="hover:text-zinc-200 transition-colors"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: WHAT IS TRIVOX (3 HORIZONTAL PILLARS) */}
        <section
          id="overview"
          className="w-full border-b border-zinc-900 px-6 lg:px-12 py-20 lg:py-24"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/70 px-3.5 py-1 text-xs text-zinc-300">
              Cấu trúc mô hình
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-semibold text-zinc-100">
              Khác biệt hoàn toàn với lưới 3D đặc
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Mỗi sản phẩm được tạo thành từ các khối hình học sạch, đặt đúng tâm xoay và vật liệu riêng cho từng chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            {LANDING_PILLARS.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/35 p-6 flex items-start gap-4 hover:border-zinc-700 transition-colors"
              >
                <div className="h-11 w-11 shrink-0 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-200">
                  {index === 0 && <Layers className="h-5 w-5" />}
                  {index === 1 && <SlidersHorizontal className="h-5 w-5" />}
                  {index === 2 && <MessageSquare className="h-5 w-5" />}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-100">
                    {item.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: HOW IT WORKS (4 TALL CARDS) */}
        <section
          id="workflow"
          className="w-full border-b border-zinc-900 px-6 lg:px-12 py-20 lg:py-24"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/70 px-3.5 py-1 text-xs text-zinc-300">
              Quy trình thực hiện
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-semibold text-zinc-100">
              Từ ảnh mẫu đến tệp 3D hoàn chỉnh
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl">
              Bốn bước khép kín ngay trên trình duyệt mà không cần cài đặt phần mềm nặng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 w-full">
            {/* Card 1 */}
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-6 flex flex-col justify-between min-h-[360px]">
              <div className="space-y-2 text-center">
                <h3 className="text-base font-semibold text-zinc-100">
                  1. Tải ảnh mẫu
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Đính kèm ảnh chụp thực tế hoặc bản phác thảo kèm kích thước mong muốn.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5 flex flex-col items-center justify-center gap-3 h-48">
                <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-200">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <span className="text-xs text-zinc-300">
                  reference_product.png
                </span>
                <span className="text-[11px] text-zinc-500">
                  600 × 600 × 850 mm
                </span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-6 flex flex-col justify-between min-h-[360px]">
              <div className="space-y-2 text-center">
                <h3 className="text-base font-semibold text-zinc-100">
                  2. Tách khối chi tiết
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Hệ thống dựng riêng từng bộ phận và gán vật liệu bề mặt tương ứng.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-3 flex flex-col justify-center gap-1.5 h-48 text-xs">
                <div className="px-3 py-2 rounded-md text-zinc-400 flex items-center justify-between">
                  <span>Khung thân chính</span>
                  <span className="text-[11px] text-zinc-500">Kim loại sơn</span>
                </div>
                <div className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-100 font-medium flex items-center justify-between">
                  <span>Cửa trước</span>
                  <span className="text-[11px] text-zinc-300">Bản lề 140°</span>
                </div>
                <div className="px-3 py-2 rounded-md text-zinc-400 flex items-center justify-between">
                  <span>Mặt kính trong</span>
                  <span className="text-[11px] text-zinc-500">Kính cường lực</span>
                </div>
                <div className="px-3 py-2 rounded-md text-zinc-400 flex items-center justify-between">
                  <span>Khay trượt trên</span>
                  <span className="text-[11px] text-zinc-500">Trượt 180 mm</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-6 flex flex-col justify-between min-h-[360px]">
              <div className="space-y-2 text-center">
                <h3 className="text-base font-semibold text-zinc-100">
                  3. Tinh chỉnh trực tiếp
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Nhập câu lệnh để đổi màu sắc, kích thước hoặc kiểm tra biên độ khớp.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between h-48">
                <div className="flex items-center justify-center flex-1">
                  <Box className="h-12 w-12 text-zinc-300 stroke-[1.4]" />
                </div>
                <div className="rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-2 flex items-center justify-between text-xs">
                  <span className="text-zinc-300 truncate">
                    Đổi thân vỏ sang màu trắng...
                  </span>
                  <span className="h-6 w-6 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-6 flex flex-col justify-between min-h-[360px]">
              <div className="space-y-2 text-center">
                <h3 className="text-base font-semibold text-zinc-100">
                  4. Xuất GLB & Blender
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Tải tệp .glb nhúng trực tiếp lên web hoặc mở tệp .blend sửa tiếp trong Blender.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-center gap-2.5 h-48 text-xs">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-100">model.blend</div>
                    <div className="text-[11px] text-zinc-400">
                      Tệp gốc mở bằng Blender
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-zinc-300" />
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-zinc-100">model.glb</div>
                    <div className="text-[11px] text-zinc-400">
                      Chuẩn Web & Game Engine
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-zinc-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: WORKSPACE BENTO */}
        <section id="workspace" className="w-full px-6 lg:px-12 py-20 lg:py-24">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/70 px-3.5 py-1 text-xs text-zinc-300">
              Không gian làm việc
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-semibold text-zinc-100">
              Quản lý dự án và lịch sử phiên bản
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
            <div className="lg:col-span-7 rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-7 flex flex-col justify-between gap-6">
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-xs">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 space-y-1">
                  <div className="text-zinc-400 text-[11px]">Phiên bản v3</div>
                  <div className="text-zinc-100 font-medium">
                    Đổi màu trắng nhám
                  </div>
                </div>
                <div className="rounded-lg border border-zinc-800/70 bg-zinc-950 p-3 space-y-1">
                  <div className="text-zinc-500 text-[11px]">Phiên bản v2</div>
                  <div className="text-zinc-300">Thêm bản lề cửa 140°</div>
                </div>
                <div className="rounded-lg border border-zinc-800/70 bg-zinc-950 p-3 space-y-1">
                  <div className="text-zinc-500 text-[11px]">Phiên bản v1</div>
                  <div className="text-zinc-300">Khởi tạo từ ảnh mẫu</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Khôi phục bất kỳ phiên bản nào
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Mọi lần chỉnh sửa đều lưu riêng mã nguồn tham số và tệp 3D tương ứng. Bạn có thể quay lại phiên bản cũ chỉ với một thao tác.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-7 flex flex-col justify-between gap-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span>Bản lề cửa trước</span>
                  <span className="tabular-nums text-zinc-400">95°</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full w-2/3 bg-zinc-200 rounded-full" />
                </div>
                <div className="flex items-center justify-between text-zinc-300 pt-1">
                  <span>Ngăn kéo trượt</span>
                  <span className="tabular-nums text-zinc-400">120 mm</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full w-3/5 bg-zinc-200 rounded-full" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-semibold text-zinc-100">
                  Kiểm thử chuyển động trực quan
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Kéo thanh trượt để kiểm tra va chạm, góc mở bản lề và hành trình trượt trước khi xuất tệp sản xuất.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-zinc-900 px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2.5">
          <img
            src="/trivox_logo.png"
            alt="Trivox"
            className="h-5 w-5 object-contain"
          />
          <span className="text-zinc-200 font-medium">Trivox</span>
        </div>

        <div className="flex items-center gap-6">
          <Link to="/login" className="hover:text-zinc-100 transition-colors">
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="hover:text-zinc-100 transition-colors"
          >
            Đăng ký
          </Link>
          <Link
            to={primaryHref}
            className="hover:text-zinc-100 transition-colors"
          >
            Studio
          </Link>
        </div>
      </footer>
    </div>
  );
}
