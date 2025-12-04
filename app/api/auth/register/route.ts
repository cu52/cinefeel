// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, nickname } = await req.json();

    if (!email || !password || !nickname) {
      return NextResponse.json(
        { message: 'email, password, nickname은 필수입니다.' },
        { status: 400 },
      );
    }

    // 이미 존재하는 이메일인지 확인
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: '이미 사용 중인 이메일입니다.' },
        { status: 409 },
      );
    }

    // 비밀번호 해싱
    const passwordHash = await hashPassword(password);

    // 유저 생성 (비밀번호는 해시로 저장)
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        nickname,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    });

    // JWT 발급
    const token = signToken(user.id);

    // 응답 + 쿠키 설정
    const res = NextResponse.json(
      {
        message: 'register success',
        user,
      },
      { status: 201 },
    );

    res.cookies.set('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('POST /api/auth/register error', error);
    return NextResponse.json(
      { message: '서버 오류', error: String(error) },
      { status: 500 },
    );
  }
}
