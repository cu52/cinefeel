import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password || !nickname) {
      return NextResponse.json(
        { message: "이메일, 비밀번호, 닉네임을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { message: "이미 존재하는 이메일입니다." },
        { status: 400 }
      );
    }

    // bcryptjs를 사용하는 너희 프로젝트에 맞게 해시
    const hashed = await hashPassword(password);

    // User 생성 (nickname 필수)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        nickname,
      },
    });

    // generateToken → userId: number | string 모두 허용해야 함
    const token = await generateToken(user.id as any);

    const res = NextResponse.json(
      {
        message: "signup ok",
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        },
      },
      { status: 201 }
    );

    // 로그인 API와 동일한 구조로 쿠키 설정
    res.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    return res;
  } catch (err) {
    console.error("SIGNUP ERROR", err);
    return NextResponse.json(
      { message: "회원가입 실패", error: String(err) },
      { status: 500 }
    );
  }
}
