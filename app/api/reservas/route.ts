import { NextRequest } from "next/server";
import { ApiError, handleError, ok, requireObjectId, sanitizeDoc } from "../../../lib/api";
import { requireAuth } from "../../../lib/auth";
import { connectMongo } from "../../../lib/mongodb";
import Reserva from "../../../models/Reserva";
import Veiculo from "../../../models/Veiculo";
import HistoricoStatus from "../../../models/HistoricoStatus";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectMongo();
    const filters: Record<string, unknown> = {};
    if (user.perfil === "vendedor") filters.vendedorId = user.id;
    const reservas = await Reserva.find(filters).sort({ createdAt: -1 });
    return ok({ reservas: reservas.map(sanitizeDoc) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, ["vendedor"]);
    await connectMongo();
    const { veiculoId, observacao } = await request.json();
    requireObjectId(veiculoId, "Veiculo");
    if (!user.concessionariaId) throw new ApiError(400, "Vendedor sem concessionaria.");
    const veiculo = await Veiculo.findById(veiculoId);
    if (!veiculo || veiculo.status !== "disponivel") {
      throw new ApiError(409, "Este veiculo nao esta disponivel para reserva.");
    }
    const active = await Reserva.findOne({ veiculoId, status: "ativa" });
    if (active) throw new ApiError(409, "Este veiculo ja possui uma reserva ativa.");
    const reserva = await Reserva.create({
      veiculoId,
      vendedorId: user.id,
      concessionariaId: user.concessionariaId,
      observacao,
      status: "ativa",
    });
    veiculo.status = "reservado";
    await veiculo.save();
    await HistoricoStatus.create({
      veiculoId,
      statusAnterior: "disponivel",
      statusNovo: "reservado",
      alteradoPor: user.id,
      observacao: "Reserva criada",
    });
    return ok({ reserva: sanitizeDoc(reserva) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

