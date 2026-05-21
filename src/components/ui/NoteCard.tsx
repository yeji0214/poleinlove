import { type ReactNode } from 'react'

type NoteCardProps = {
  borderColor: string
  icon: ReactNode
  title: string
  children: ReactNode
}

export function NoteCard({ borderColor, icon, title, children }: NoteCardProps) {
  return (
    <section className={`rounded-2xl border-l-4 ${borderColor} bg-white p-5 shadow-sm`}>
      <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-zinc-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}
