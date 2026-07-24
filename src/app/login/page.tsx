import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900">
        <Logo className="mb-1" />
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">비밀번호를 입력해주세요</p>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
