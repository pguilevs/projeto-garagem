import { NextRequest } from "next/server";
import { ApiError, handleError, ok, requireObjectId, sanitizeDoc } from "../../../../../lib/api";
import { requireAuth } from "../../../../../lib/auth";
import { connectMongo } from "../../../../../lib/mongodb";
import Reserva from "../../../../../models/Reserva";
import Veiculo from "../../../../../models/Veiculo";
import HistoricoStatus from "../../../../../models/HistoricoStatus";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Reserva");
    const { status, observacao } = await request.json();
    if (!["cancelada", "concluida"].includes(status)) {
      throw new ApiError(400, "Status de reserva invalido.");
    }
    const reserva = await Reserva.findById(id);
    if (!reserva) throw new ApiError(404, "Reserva nao encontrada.");
    if (user.perfil === "vendedor" && String(reserva.vendedorId) !== user.id) {
      throw new ApiError(403, "Acesso negado para esta reserva.");
    }
    if (reserva.status !== "ativa") throw new ApiError(409, "Reserva ja encerrada.");
    const veiculo = await Veiculo.findById(reserva.veiculoId);
    if (!veiculo) throw new ApiError(404, "Veiculo nao encontrado.");
    const statusAnterior = veiculo.status;
    reserva.status = status;
    reserva.dataEncerramento = new Date();
    reserva.observacao = observacao ?? reserva.observacao;
    veiculo.status = status === "cancelada" ? "disponivel" : "vendido";
    await reserva.save();
    await veiculo.save();
    await HistoricoStatus.create({
      veiculoId: veiculo._id,
      statusAnterior,
      statusNovo: veiculo.status,
      alteradoPor: user.id,
      observacao: `Reserva ${status}`,
    });
    return ok({ reserva: sanitizeDoc(reserva), veiculo: sanitizeDoc(veiculo) });
  } catch (error) {
    return handleError(error);
  }
}

