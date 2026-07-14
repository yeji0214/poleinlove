import { LogoMark } from "./LogoMark";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`}>
      <LogoMark />
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
        Pole<span className="text-[#C97985]">in</span>love
      </h1>
    </div>
  );
}
