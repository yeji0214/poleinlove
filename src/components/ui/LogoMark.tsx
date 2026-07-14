type LogoMarkProps = {
  className?: string;
};

// 세로 폴에 리본이 앞뒤로 감기는 로고 심볼.
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      className={`relative inline-flex h-10 w-9 items-center justify-center ${className ?? ""}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 28 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-auto"
      >
        <defs>
          <linearGradient id="poleinlove-ribbon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F5C4CB" />
            <stop offset="50%" stopColor="#EBA6B0" />
            <stop offset="100%" stopColor="#DD8E9A" />
          </linearGradient>
        </defs>

        {/* 리본: 뒷면/그림자 (전체 스파이럴) */}
        <path
          d="M23 10 C23 13.5 5 15 5 18 C5 21.5 23 22.5 23 26 C23 29.5 5 30.5 5 34"
          stroke="#C97985"
          strokeWidth={4.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
        {/* 리본: 본체 (전체 스파이럴, 그라디언트) */}
        <path
          d="M23 10 C23 13.5 5 15 5 18 C5 21.5 23 22.5 23 26 C23 29.5 5 30.5 5 34"
          stroke="url(#poleinlove-ribbon)"
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 세로 폴 (리본 위에 그려서 폴 뒤로 지나가는 느낌을 만듦) */}
        <line
          x1="14"
          y1="4"
          x2="14"
          y2="40"
          stroke="#8A8A90"
          strokeWidth="3.1"
          strokeLinecap="round"
        />

        {/* 리본: 폴 앞으로 지나가는 구간을 다시 위에 그림 */}
        <path
          d="M5 18 C5 21.5 23 22.5 23 26"
          stroke="#C97985"
          strokeWidth={4.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
        <path
          d="M5 18 C5 21.5 23 22.5 23 26"
          stroke="url(#poleinlove-ribbon)"
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
