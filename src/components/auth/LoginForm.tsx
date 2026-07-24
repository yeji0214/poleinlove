"use client";

import { useActionState } from "react";
import { login } from "@/app/login/actions";
import { ExclamationIcon } from "@/components/ui/icons";

export function LoginForm({ from }: { from?: string }) {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="from" value={from ?? ""} />

      {state?.error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-500 dark:bg-red-950 dark:text-red-400"
        >
          <ExclamationIcon className="shrink-0 text-red-400" />
          {state.error}
        </div>
      )}

      <input
        type="password"
        name="password"
        required
        autoFocus
        placeholder="비밀번호"
        className="rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500"
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-2xl bg-rose-300 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "확인 중..." : "입장하기"}
      </button>
    </form>
  );
}
