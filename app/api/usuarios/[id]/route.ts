import { NextRequest } from "next/server";
import { handleError, ok, requireObjectId, sanitizeDoc } from "../../../../lib/api";
import { hashPassword, requireAuth } from "../../../../lib/auth";
import { connectMongo } from "../../../../lib/mongodb";
import Usuario from "../../../../models/Usuario";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Usuario");
    const input = (await request.json()) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const field of ["nome", "email", "perfil", "concessionariaId", "ativo"]) {
      if (input[field] !== undefined) update[field] = input[field];
    }
    if (input.senha) update.senha = await hashPassword(String(input.senha));

    const usuario = await Usuario.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).select("-senha");

    return ok({ usuario: sanitizeDoc(usuario) });
  } catch (error) {
    return handleError(error);
  }
}

