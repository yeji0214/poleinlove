import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin
  const params = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: `${origin}/api/instagram/callback`,
    scope: 'instagram_business_basic',
    response_type: 'code',
  })
  return NextResponse.redirect(`https://www.instagram.com/oauth/authorize?${params}`)
}
