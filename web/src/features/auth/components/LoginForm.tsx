import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  loginFormSchema,
  type LoginFormValues,
} from '@/schemas/auth.schema';
import { loginWithCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { GoogleAuthButton } from './GoogleAuthButton';

export function LoginForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginWithCredentials,
    onSuccess: (res) => {
      setUser(res.user);
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 text-zinc-100">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg font-semibold text-zinc-100">
          Đăng nhập vào Trivox
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Đăng nhập bằng Google hoặc tài khoản email để truy cập dự án 3D.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleAuthButton />

        {oauthError === 'google_not_configured' && (
          <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2">
            Máy chủ chưa cấu hình GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong api/.env.
          </p>
        )}

        {oauthError === 'google_auth_failed' && (
          <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2">
            Xác thực qua Google không thành công. Vui lòng thử lại.
          </p>
        )}

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-zinc-800" />
          <span className="mx-3 shrink text-[11px] text-zinc-500">hoặc</span>
          <div className="grow border-t border-zinc-800" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email" className="text-xs text-zinc-300">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                {...register('email')}
              />
              {errors.email && (
                <FieldError className="text-xs text-zinc-400">
                  {errors.email.message}
                </FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password" className="text-xs text-zinc-300">
                Mật khẩu
              </FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                {...register('password')}
              />
              {errors.password && (
                <FieldError className="text-xs text-zinc-400">
                  {errors.password.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>

          {loginMutation.isError && (
            <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2">
              {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : 'Đăng nhập thất bại'}
            </p>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
          >
            {loginMutation.isPending ? 'Đang xác thực...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Chưa có tài khoản?</span>
          <Link
            to="/register"
            className="text-zinc-100 hover:underline font-medium"
          >
            Tạo tài khoản mới
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
