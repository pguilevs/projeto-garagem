import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { NextRequest } from "next/server";
import { ApiError, Perfil } from "./api";
import { connectMongo } from "./mongodb";
import Usuario from "../models/Usuario";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  concessionariaId?: string;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new ApiError(500, "JWT_SECRET nao configurado.");
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser) {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"],
  };
  return jwt.sign(user, jwtSecret(), options);
}

export async function requireAuth(request: NextRequest, allowedProfiles?: Perfil[]) {
  await connectMongo();
  const authorization = request.headers.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Token de autenticacao ausente.");
  }

  let payload: AuthUser;
  try {
    payload = jwt.verify(token, jwtSecret()) as AuthUser;
  } catch {
    throw new ApiError(401, "Token invalido ou expirado.");
  }

  const user = await Usuario.findById(payload.id).select("-senha");
  if (!user) throw new ApiError(401, "Usuario nao encontrado.");
  if (!user.ativo) throw new ApiError(403, "Usuario inativo.");

  if (allowedProfiles && !allowedProfiles.includes(user.perfil)) {
    throw new ApiError(403, "Acesso negado para este perfil.");
  }

  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    perfil: user.perfil,
    concessionariaId: user.concessionariaId ? String(user.concessionariaId) : undefined,
  };
}
