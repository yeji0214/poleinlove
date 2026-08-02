// 인스타그램 캡션에서 #pd기술명 해시태그를 파싱하는 순수 로직.
// Prisma/Supabase/Claude 클라이언트를 초기화하는 instagram-sync.ts와 분리해,
// 외부 서비스 연결 없이 독립적으로 테스트할 수 있게 했다.

export function extractSkillFromCaption(caption: string | null | undefined): string {
  if (!caption) return ''
  const matches = [...caption.matchAll(/#pd([a-zA-Z가-힣]+)/gi)]
  if (matches.length === 0) return ''
  return matches.map((m) => m[1].charAt(0).toUpperCase() + m[1].slice(1)).join(' · ')
}
