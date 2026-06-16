"use client";

import { useRef, useState } from "react";

type Props = {
  images: { id: number; url: string; alt: string | null }[];
  altFallback: string;
};

export function ImageCarousel({ images, altFallback }: Props) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number>(0);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && index < images.length - 1) setIndex((i) => i + 1);
    if (diff < -50 && index > 0) setIndex((i) => i - 1);
  }

  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-2xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index].url}
        alt={images[index].alt ?? altFallback}
        className="h-full w-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity disabled:opacity-0"
            aria-label="이전 사진"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => i + 1)}
            disabled={index === images.length - 1}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition-opacity disabled:opacity-0"
            aria-label="다음 사진"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* 페이지 인디케이터 */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
