import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "존재하지 않는 사용자입니다." },
        { status: 400 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { message: "비밀번호가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const token = await generateToken(user.id);

    // ✔ Set-Cookie 직접 설정
    const res = NextResponse.json({
      message: "login ok",
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    });

    res.headers.append(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; Max-Age=604800; SameSite=Lax${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );

    return res;
  } catch (err) {
    console.error("LOGIN ERROR", err);
    return NextResponse.json(
      { message: "로그인 실패", error: String(err) },
      { status: 500 }
    );
  }
}
