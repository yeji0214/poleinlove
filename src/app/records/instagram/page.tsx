import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { importReel } from './actions'

interface InstagramReel {
  id: string
  caption?: string
  media_type: string
  thumbnail_url?: string
  timestamp: string
  permalink: string
}

function extractSkillFromCaption(caption: string | null | undefined): string {
  if (!caption) return ''
  const matches = [...caption.matchAll(/#pd([a-zA-Z가-힣]+)/gi)]
  if (matches.length === 0) return ''
  return matches.map(m => m[1].charAt(0).toUpperCase() + m[1].slice(1)).join(' · ')
}

async function fetchReels(accessToken: string): Promise<{ reels?: InstagramReel[]; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,thumbnail_url,timestamp,permalink&limit=30&access_token=${accessToken}`,
      { cache: 'no-store' },
    )
    const data = await res.json()
    if (data.error) return { error: data.error.message }
    const reels = (data.data ?? []).filter(
      (item: InstagramReel) => item.media_type === 'REEL' || item.media_type === 'VIDEO',
    )
    return { reels }
  } catch {
    return { error: '네트워크 오류가 발생했습니다.' }
  }
}

export default async function InstagramPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error: queryError } = await searchParams
  const token = await prisma.instagramToken.findFirst()

  if (!token) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="mx-auto w-full max-w-2xl px-5 pb-4 pt-8">
          <div className="flex items-center gap-3">
            <Link href="/records" className="text-sm text-zinc-400 hover:text-zinc-600">
              ← 뒤로
            </Link>
            <h1 className="text-xl font-bold text-zinc-900">인스타그램 연동</h1>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl px-5">
          {queryError && (
            <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              연동 중 오류가 발생했습니다. 다시 시도해주세요.
            </p>
          )}
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-orange-400">
              <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
            <p className="text-zinc-500">인스타그램을 연동하면 릴스를 기록으로 가져올 수 있어요.</p>
            <a
              href="/api/instagram/auth"
              className="rounded-2xl bg-rose-300 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              인스타그램 연동하기
            </a>
          </div>
        </main>
      </div>
    )
  }

  const { reels, error: fetchError } = await fetchReels(token.accessToken)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto w-full max-w-2xl px-5 pb-4 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/records" className="text-sm text-zinc-400 hover:text-zinc-600">
              ← 뒤로
            </Link>
            <h1 className="text-xl font-bold text-zinc-900">인스타그램에서 가져오기</h1>
          </div>
          <a
            href="/api/instagram/auth"
            className="text-xs text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
          >
            재연동
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-12">
        {fetchError ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <p className="text-zinc-500">{fetchError}</p>
            <a
              href="/api/instagram/auth"
              className="rounded-2xl bg-rose-300 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              재연동하기
            </a>
          </div>
        ) : reels && reels.length === 0 ? (
          <div className="py-24 text-center text-zinc-500">릴스가 없어요.</div>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              최근 릴스 {reels?.length}개 · #pd로 시작하는 해시태그에서 기술명을 자동으로 추출해요
            </p>
            <ul className="flex flex-col gap-3">
              {reels?.map((reel) => {
                const skillName = extractSkillFromCaption(reel.caption)
                const date = new Date(reel.timestamp).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
                return (
                  <li key={reel.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <div className="flex gap-4">
                      {reel.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reel.thumbnail_url}
                          alt={skillName || '릴스 썸네일'}
                          className="h-24 w-24 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                          <svg className="h-6 w-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <p className="text-xs text-zinc-400">{date}</p>
                          {skillName && (
                            <p className="mt-0.5 font-bold text-zinc-900">{skillName}</p>
                          )}
                          {reel.caption && (
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                              {reel.caption}
                            </p>
                          )}
                        </div>
                        <form action={importReel} className="mt-2">
                          <input type="hidden" name="caption" value={reel.caption ?? ''} />
                          <input type="hidden" name="thumbnailUrl" value={reel.thumbnail_url ?? ''} />
                          <input type="hidden" name="timestamp" value={reel.timestamp} />
                          <button
                            type="submit"
                            className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-500 transition-colors hover:bg-rose-100"
                          >
                            기록으로 가져오기
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  )
}
