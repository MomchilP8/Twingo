import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: 'Единственият наличен метод за плащане е Наложен платеж при получаване от офис на Еконт.' },
    { status: 400 }
  )
}