export default function Loading() {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto w-full max-w-xl px-4 pb-12 pt-8">
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      </div>
    </div>
  )
}
