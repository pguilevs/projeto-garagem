import { NextRequest } from "next/server";
import { ApiError, handleError, ok } from "../../../../lib/api";
import { comparePassword, signToken } from "../../../../lib/auth";
import { connectMongo } from "../../../../lib/mongodb";
import Usuario from "../../../../models/Usuario";

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    const { email, senha } = (await request.json()) as Record<string, string>;
    if (!email || !senha) throw new ApiError(400, "Informe email e senha.");

    const user = await Usuario.findOne({ email: email.toLowerCase() }).select("+senha");
    if (!user) throw new ApiError(401, "Email ou senha invalidos.");
    if (!user.ativo) throw new ApiError(403, "Usuario inativo.");

    const valid = await comparePassword(senha, user.senha);
    if (!valid) throw new ApiError(401, "Email ou senha invalidos.");

    const authUser = {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      perfil: user.perfil,
      concessionariaId: user.concessionariaId ? String(user.concessionariaId) : undefined,
    };

    return ok({ token: signToken(authUser), usuario: authUser });
  } catch (error) {
    return handleError(error);
  }
}

