// lib/auth.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function hashPassword(password: string) {
  const hashed = await bcrypt.hash(password, 10);
  return hashed;
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

// 🔽 여기 수정
export function generateToken(userId: string | number) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
}

// register에서 쓰는 이름도 지원 (동일 구현)
export const signToken = generateToken;

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string | number;
    };
  } catch (err) {
    return null;
  }
}
