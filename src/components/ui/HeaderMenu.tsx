"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ChartBarIcon, CogIcon, LogoutIcon, MoonIcon, SunIcon } from "@/components/ui/icons";

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // layout.tsx의 플래시 방지 스크립트가 하이드레이션 전에 이미 <html>의
    // dark 클래스를 정해두므로, 마운트 시점에 그 값을 한 번 읽어와 동기화한다.
    // 브라우저 DOM 상태라 서버 렌더링 중에는 알 수 없어 effect가 필요하다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleDark() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", next ? "#09090b" : "#fafaf9");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-xl p-2 text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
        aria-label="설정"
      >
        <CogIcon />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl bg-surface py-1.5 shadow-lg ring-1 ring-divider">
          <Link
            href="/stats"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted"
          >
            <ChartBarIcon className="h-4 w-4" />
            통계
          </Link>
          <button
            type="button"
            onClick={toggleDark}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-muted"
          >
            {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {isDark ? "라이트 모드" : "다크 모드"}
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-muted"
            >
              <LogoutIcon className="h-4 w-4" />
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
