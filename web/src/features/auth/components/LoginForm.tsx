import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
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
import {
  getGoogleAuthConfig,
  loginWithCredentials,
  loginWithGoogleToken,
} from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export function LoginForm() {
  const setUser = useAuthStore((s) => s.setUser);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const googleConfigQuery = useQuery({
    queryKey: ['google-auth-config'],
    queryFn: getGoogleAuthConfig,
  });

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

  const googleMutation = useMutation({
    mutationFn: loginWithGoogleToken,
    onSuccess: (res) => {
      setUser(res.user);
    },
    onError: (err) => {
      setGoogleError(
        err instanceof Error ? err.message : 'Đăng nhập Google thất bại',
      );
    },
  });

  useEffect(() => {
    setGoogleError(null);
  }, []);

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const googleClientId = googleConfigQuery.data?.clientId || '';
  const isGoogleEnabled = Boolean(
    googleConfigQuery.data?.enabled && googleClientId,
  );

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 text-zinc-100">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg font-semibold text-zinc-100">
          Đăng nhập vào Trivox
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Nhập thông tin tài khoản để truy cập danh sách dự án và không gian thiết kế 3D.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGoogleEnabled && (
          <GoogleOAuthProvider clientId={googleClientId}>
            <div className="flex flex-col items-center space-y-2 pb-2 border-b border-zinc-800">
              <GoogleLogin
                onSuccess={(cred) => {
                  if (cred.credential) {
                    googleMutation.mutate(cred.credential);
                  }
                }}
                onError={() => {
                  setGoogleError('Không thể xác thực qua Google.');
                }}
                theme="filled_black"
                size="large"
                width="360"
              />
              {googleError && (
                <p className="text-xs text-zinc-300">{googleError}</p>
              )}
            </div>
          </GoogleOAuthProvider>
        )}

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
