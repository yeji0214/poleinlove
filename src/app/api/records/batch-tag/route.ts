import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic()
const DIFFICULTY_TAGS = ['입문', '초급', '중급', '고급'] as const
const BATCH_SIZE = 10

export async function POST() {
  // 아직 AI 처리 안 된 기록만 ([] = 미처리, ['미분류'] = 처리 완료·해당 없음이므로 스킵)
  const records = await prisma.record.findMany({
    where: {
      tags: { equals: [] },
      sessionNote: { not: null },
    },
    select: { id: true, skillName: true, sessionNote: true },
    take: BATCH_SIZE,
  })

  const total = await prisma.record.count({
    where: { tags: { equals: [] } },
  })

  if (records.length === 0) {
    return NextResponse.json({ tagged: 0, remaining: 0 })
  }

  const input = records.map((r) => ({
    id: String(r.id),
    skill: r.skillName,
    caption: (r.sessionNote ?? '').slice(0, 300),
  }))

  let tagMap: Record<string, string[]> = {}
  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `다음 폴댄스 기록들의 난이도를 판단해줘. 입문/초급/중급/고급 중 명확히 해당하는 것만 JSON으로 반환해.

난이도 기준:
- 입문: 폴댄스를 처음 배우는 단계의 기초 동작
- 초급: 기본기를 익힌 후 배우는 동작
- 중급: 어느 정도 힘과 유연성이 필요한 동작
- 고급: 높은 수준의 힘, 유연성, 기술이 복합적으로 필요한 동작

중요: 캡션만으로 난이도를 확신할 수 없거나, 기술명만으로 판단이 어려우면 반드시 빈 배열 []을 반환해. 억지로 태그를 붙이지 마.

기록: ${JSON.stringify(input)}

응답 형식 (다른 말 없이 JSON만): {"1": ["초급"], "2": [], "3": ["중급","고급"]}`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : '{}'
    // 마크다운 코드블록 제거
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    tagMap = JSON.parse(text)
  } catch {
    // Claude 실패 시 빈 태그로 처리 (무한루프 방지)
    tagMap = {}
  }

  for (const record of records) {
    const raw = tagMap[String(record.id)] ?? []
    const tags = [...new Set(raw.filter((t) => (DIFFICULTY_TAGS as readonly string[]).includes(t)))]
    // 매칭된 난이도 태그 없으면 ['미분류']로 마킹 → 재처리 스킵, UI엔 미표시
    await prisma.record.update({
      where: { id: record.id },
      data: { tags: tags.length > 0 ? tags : ['미분류'] },
    })
  }

  return NextResponse.json({
    tagged: records.length,
    remaining: Math.max(0, total - records.length),
  })
}
