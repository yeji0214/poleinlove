import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const client = new Anthropic()

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const record = await prisma.record.findUnique({
    where: { id: Number(id) },
    select: { sessionNote: true, skillName: true },
  })

  if (!record?.sessionNote) {
    return NextResponse.json({ error: '캡션이 없어요' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `다음은 폴댄스 수업 후 인스타그램에 올린 캡션이야. 이 캡션을 읽고, 오늘 어떤 기술을 연습했는지, 잘 됐던 점과 아쉬웠던 점, 앞으로 신경 쓰고 싶은 부분을 자연스러운 한국어 2~3문장으로 요약해줘. 해시태그나 이모지는 빼고, 말투는 편하게.

캡션:
${record.sessionNote}`,
      },
    ],
  })

  const summary = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ summary })
}
