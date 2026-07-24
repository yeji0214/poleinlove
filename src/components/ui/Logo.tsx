import Link from "next/link";
import { LogoMark } from "./LogoMark";

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/records" className={`flex items-center gap-1 ${className ?? ""}`}>
      <LogoMark />
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Poleinlove
      </h1>
    </Link>
  );
}
