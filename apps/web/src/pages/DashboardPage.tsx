import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Box, Layers, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  deleteProjectById,
  fetchProjectsList,
} from '@/services/studio.service';
import { DashboardSidebar } from '../features/dashboard/components/DashboardSidebar';
import { CreateProjectDialog } from '../features/dashboard/components/CreateProjectDialog';

export function DashboardPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const projectsQuery = useQuery({
    queryKey: ['projects-list'],
    queryFn: fetchProjectsList,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProjectById,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects-list'] });
    },
  });

  const projects = projectsQuery.data?.projects || [];

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex">
      <DashboardSidebar
        onOpenCreate={() => setIsCreateOpen(true)}
        projectsCount={projects.length}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="w-full h-14 border-b border-zinc-800 px-6 lg:px-8 flex items-center justify-between bg-zinc-950 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-zinc-100">Dự án</h1>
            <Badge
              variant="outline"
              className="border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-normal"
            >
              {projects.length}
            </Badge>
          </div>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-8 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Dự án mới</span>
          </Button>
        </header>

        <main className="flex-1 w-full p-6 lg:p-8 overflow-y-auto">
          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-60 rounded-lg border border-zinc-800 bg-zinc-900/40 animate-pulse"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="w-full h-[65vh] rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <div className="h-10 w-10 rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-300">
                <Box className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-md">
                <h2 className="text-sm font-semibold text-zinc-100">
                  Chưa có dự án
                </h2>
                <p className="text-xs text-zinc-400">
                  Tải ảnh mẫu hoặc nhập mô tả để tạo mô hình 3D đầu tiên.
                </p>
              </div>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="h-9 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo dự án</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="h-36 bg-zinc-950 border-b border-zinc-800 flex items-center justify-center relative overflow-hidden">
                      {proj.referenceImageUrl ? (
                        <img
                          src={proj.referenceImageUrl}
                          alt={proj.title}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-zinc-500">
                          <Box className="h-7 w-7 text-zinc-400" />
                          <span className="text-[11px]">
                            {proj.dimensions.width} × {proj.dimensions.depth} ×{' '}
                            {proj.dimensions.height} mm
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5">
                        <Badge
                          variant="outline"
                          className="border-zinc-800 bg-zinc-900/90 text-zinc-300 text-[11px] font-normal"
                        >
                          v{proj.modelVersion}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">
                        {proj.title}
                      </h3>
                      {proj.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" />
                        {proj.partsCount} chi tiết
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {proj.jointsCount} khớp
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 h-8 bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
                      >
                        <Link to={`/studio/${proj.id}`}>Mở Studio</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(proj.id)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}
