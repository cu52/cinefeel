// app/api/test-prisma/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return NextResponse.json(
      {
        message: 'prisma test ok',
        users,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/test-prisma error', error);

    return NextResponse.json(
      {
        message: 'prisma test error',
        error: String(error),
      },
      { status: 500 },
    );
  }
}
