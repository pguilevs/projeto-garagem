import { NextRequest } from "next/server";
import { ApiError, handleError, ok, requireObjectId, sanitizeDoc } from "../../../../../lib/api";
import { requireAuth } from "../../../../../lib/auth";
import { connectMongo } from "../../../../../lib/mongodb";
import Veiculo from "../../../../../models/Veiculo";
import HistoricoStatus from "../../../../../models/HistoricoStatus";

const allowed = new Set(["cadastrado", "disponivel", "reservado", "vendido"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Veiculo");
    const { status, observacao } = await request.json();
    if (!allowed.has(status)) throw new ApiError(400, "Status invalido.");
    const current = await Veiculo.findById(id);
    if (!current) throw new ApiError(404, "Veiculo nao encontrado.");
    const statusAnterior = current.status;
    current.status = status;
    await current.save();
    await HistoricoStatus.create({
      veiculoId: id,
      statusAnterior,
      statusNovo: status,
      alteradoPor: user.id,
      observacao,
    });
    return ok({ veiculo: sanitizeDoc(current) });
  } catch (error) {
    return handleError(error);
  }
}

