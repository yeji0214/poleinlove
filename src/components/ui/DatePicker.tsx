"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatDateString,
  getDaysInMonth,
  getFirstWeekday,
  getTodayDateString,
} from "@/lib/date";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  max?: string;
  invalid?: boolean;
};

export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  max,
  invalid,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = getTodayDateString();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const [viewYear, setViewYear] = useState(todayYear);
  const [viewMonth, setViewMonth] = useState(todayMonth);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function close() {
      setOpen(false);
      onBlur?.();
    }
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onBlur]);

  function openPicker() {
    const [y, m] = (value || today).split("-").map(Number);
    setViewYear(y);
    setViewMonth(m);
    setOpen((prev) => !prev);
  }

  function goToPrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(day: number) {
    const dateStr = formatDateString(viewYear, viewMonth, day);
    if (max && dateStr > max) return;
    onChange(dateStr);
    setOpen(false);
    onBlur?.();
  }

  const canGoNext =
    viewYear < todayYear || (viewYear === todayYear && viewMonth < todayMonth);
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function formatDisplay(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${y}년 ${m}월 ${d}일`;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={openPicker}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm outline-none ${
          invalid
            ? "border-red-300 focus:border-red-400"
            : "border-zinc-200 focus:border-zinc-400"
        } ${value ? "text-zinc-700" : "text-zinc-400"}`}
      >
        {value ? formatDisplay(value) : "날짜 선택"}
        <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-64 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-zinc-100">
          <div className="flex items-center justify-between bg-rose-300 px-3 py-2.5">
            <button
              type="button"
              onClick={goToPrevMonth}
              aria-label="이전 달"
              className="cursor-pointer rounded-full p-1 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-white">
              {viewYear}년 {viewMonth}월
            </p>
            <button
              type="button"
              onClick={goToNextMonth}
              disabled={!canGoNext}
              aria-label="다음 달"
              className="cursor-pointer rounded-full p-1 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 px-2 pt-2 text-center text-[11px] font-medium text-zinc-400">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;

              const dateStr = formatDateString(viewYear, viewMonth, day);
              const isToday = dateStr === today;
              const isSelected = dateStr === value;
              const isDisabled = !!max && dateStr > max;

              return (
                <button
                  key={dateStr}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={`mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs transition-colors disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent ${
                    isSelected
                      ? "bg-rose-300 font-semibold text-white"
                      : isToday
                        ? "font-semibold text-rose-400 hover:bg-stone-100"
                        : "text-zinc-700 hover:bg-stone-100"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
