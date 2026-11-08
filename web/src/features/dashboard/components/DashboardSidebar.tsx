import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { FolderKanban, LogOut, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logoutSession } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

interface DashboardSidebarProps {
  onOpenCreate: () => void;
  projectsCount: number;
}

export function DashboardSidebar({
  onOpenCreate,
  projectsCount,
}: DashboardSidebarProps) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const logoutMutation = useMutation({
    mutationFn: logoutSession,
    onSuccess: () => {
      setUser(null);
    },
  });

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-5">
        <Link to="/" className="flex items-center gap-2.5 px-1">
          <img
            src="/trivox_logo.png"
            alt="Trivox"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold text-zinc-100">Trivox</span>
        </Link>

        <Button
          onClick={onOpenCreate}
          className="w-full h-9 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo dự án mới</span>
        </Button>

        <nav className="space-y-1">
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-zinc-900 text-zinc-100 text-xs font-medium">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-zinc-300" />
              <span>Dự án</span>
            </div>
            <span className="text-[11px] text-zinc-400">{projectsCount}</span>
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-800 space-y-3">
        {user && (
          <div className="px-1 space-y-0.5">
            <div className="text-xs font-medium text-zinc-100 truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-zinc-400 truncate">
              {user.email}
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          className="w-full h-8 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 text-xs justify-start gap-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </aside>
  );
}
