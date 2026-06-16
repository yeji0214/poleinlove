export function getTodayDateString(): string {
  const now = new Date()
  return formatDateString(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function formatDateString(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay()
}
