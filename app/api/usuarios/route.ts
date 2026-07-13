import { NextRequest } from "next/server";
import { ApiError, handleError, ok, sanitizeDoc } from "../../../lib/api";
import { hashPassword, requireAuth } from "../../../lib/auth";
import { connectMongo } from "../../../lib/mongodb";
import Usuario from "../../../models/Usuario";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const usuarios = await Usuario.find().select("-senha").sort({ createdAt: -1 });
    return ok({ usuarios: usuarios.map(sanitizeDoc) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const input = (await request.json()) as Record<string, unknown>;
    const perfil = String(input.perfil || "vendedor");
    if (!["administrador", "vendedor"].includes(perfil)) {
      throw new ApiError(400, "Perfil invalido.");
    }
    if (perfil === "vendedor" && !input.concessionariaId) {
      throw new ApiError(400, "Informe a concessionaria do vendedor.");
    }
    if (!input.senha || String(input.senha).length < 6) {
      throw new ApiError(400, "A senha deve ter pelo menos 6 caracteres.");
    }

    const usuario = await Usuario.create({
      nome: String(input.nome || "").trim(),
      email: String(input.email || "").toLowerCase().trim(),
      senha: await hashPassword(String(input.senha)),
      perfil,
      concessionariaId: input.concessionariaId || undefined,
      ativo: input.ativo !== false,
    });

    const plain = sanitizeDoc(usuario);
    delete plain.senha;
    return ok({ usuario: plain }, 201);
  } catch (error) {
    return handleError(error);
  }
}

