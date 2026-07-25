import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-8 shadow-sm">
        <Logo className="mb-1" />
        <p className="mb-6 text-sm text-text-secondary">비밀번호를 입력해주세요</p>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
