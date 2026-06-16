import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-zinc-900">Poleinlove</h1>
        <p className="mb-6 text-sm text-zinc-500">비밀번호를 입력해주세요</p>
        <LoginForm from={from} />
      </div>
    </div>
  );
}
