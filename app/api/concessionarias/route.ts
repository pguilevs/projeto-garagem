import { NextRequest } from "next/server";
import { handleError, ok, sanitizeDoc } from "../../../lib/api";
import { requireAuth } from "../../../lib/auth";
import { connectMongo } from "../../../lib/mongodb";
import Concessionaria from "../../../models/Concessionaria";

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const concessionarias = await Concessionaria.find().sort({ createdAt: -1 });
    return ok({ concessionarias: concessionarias.map(sanitizeDoc) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const input = await request.json();
    const concessionaria = await Concessionaria.create({
      nome: input.nome,
      cnpj: input.cnpj,
      telefone: input.telefone,
      email: input.email,
      ativa: input.ativa !== false,
    });
    return ok({ concessionaria: sanitizeDoc(concessionaria) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

