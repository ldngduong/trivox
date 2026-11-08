import { Link } from 'react-router-dom';
import { RegisterForm } from '../features/auth/components/RegisterForm';

export function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="w-full h-14 border-b border-zinc-800 px-6 lg:px-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/trivox_logo.png"
            alt="Trivox"
            className="h-7 w-7 object-contain"
          />
          <span className="text-sm font-semibold text-zinc-100">Trivox</span>
        </Link>
        <Link
          to="/login"
          className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          Đăng nhập
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <RegisterForm />
      </div>
    </div>
  );
}
