import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
  registerFormSchema,
  type RegisterFormValues,
} from '@/schemas/auth.schema';
import { registerWithCredentials } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { GoogleAuthButton } from './GoogleAuthButton';

export function RegisterForm() {
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerWithCredentials,
    onSuccess: (res) => {
      setUser(res.user);
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate(values);
  };

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 text-zinc-100">
      <CardHeader className="space-y-1.5">
        <CardTitle className="text-lg font-semibold text-zinc-100">
          Tạo tài khoản Trivox
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Đăng ký nhanh qua Google hoặc email để bắt đầu tạo dự án 3D.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleAuthButton />

        <div className="relative flex items-center py-1">
          <div className="grow border-t border-zinc-800" />
          <span className="mx-3 shrink text-[11px] text-zinc-500">hoặc</span>
          <div className="grow border-t border-zinc-800" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name" className="text-xs text-zinc-300">
                Họ và tên
              </FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Nguyễn Văn A"
                className="bg-zinc-950 border-zinc-800 text-zinc-100 text-xs"
                {...register('name')}
              />
              {errors.name && (
                <FieldError className="text-xs text-zinc-400">
                  {errors.name.message}
                </FieldError>
              )}
            </Field>

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
                placeholder="Tối thiểu 6 ký tự"
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

          {registerMutation.isError && (
            <p className="text-xs text-zinc-300 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2">
              {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : 'Đăng ký thất bại'}
            </p>
          )}

          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
          >
            {registerMutation.isPending ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </form>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>Đã có tài khoản?</span>
          <Link
            to="/login"
            className="text-zinc-100 hover:underline font-medium"
          >
            Đăng nhập
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
