import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const client = new Anthropic()
const DIFFICULTY_TAGS = ['입문', '초급', '중급', '고급'] as const

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await prisma.record.findUnique({
    where: { id: Number(id) },
    select: { sessionNote: true, skillName: true },
  })

  if (!record) return NextResponse.json({ error: '기록을 찾을 수 없어요' }, { status: 404 })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 50,
    messages: [
      {
        role: 'user',
        content: `다음은 폴댄스 수업 기록이야. 기술명과 캡션을 보고 난이도를 판단해줘.

기술명: ${record.skillName}
캡션: ${record.sessionNote ?? '없음'}

난이도 기준:
- 입문: 폴댄스 처음 배우는 기초 동작
- 초급: 기본기를 익힌 후 배우는 동작
- 중급: 어느 정도 힘과 유연성이 필요한 동작
- 고급: 높은 수준의 힘, 유연성, 기술이 필요한 동작

한 수업에 여러 난이도가 있을 수 있어. 해당하는 것만 JSON 배열로 답해줘. 예: ["초급"] 또는 ["초급","중급"]
다른 말 없이 JSON만.`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : '[]'
  try {
    const tags: string[] = JSON.parse(text)
    const valid = tags.filter((t) => (DIFFICULTY_TAGS as readonly string[]).includes(t))
    return NextResponse.json({ tags: valid })
  } catch {
    return NextResponse.json({ tags: [] })
  }
}
