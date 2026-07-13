import { NextRequest } from "next/server";
import { ApiError, handleError, ok, requireObjectId, sanitizeDoc } from "../../../../lib/api";
import { requireAuth } from "../../../../lib/auth";
import { connectMongo } from "../../../../lib/mongodb";
import Veiculo from "../../../../models/Veiculo";
import HistoricoStatus from "../../../../models/HistoricoStatus";
import { normalizeImagePayload } from "../../../../services/cloudinary";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Veiculo");
    const filters: Record<string, unknown> = { _id: id };
    if (user.perfil === "vendedor") filters.status = "disponivel";
    const veiculo = await Veiculo.findOne(filters);
    if (!veiculo) throw new ApiError(404, "Veiculo nao encontrado.");
    return ok({ veiculo: sanitizeDoc(veiculo) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Veiculo");
    const input = (await request.json()) as Record<string, unknown>;
    const current = await Veiculo.findById(id);
    if (!current) throw new ApiError(404, "Veiculo nao encontrado.");
    const statusAnterior = current.status;
    const update: Record<string, unknown> = {};
    const map: Record<string, string> = {
      marca: "marca",
      brand: "marca",
      modelo: "modelo",
      model: "modelo",
      versao: "versao",
      placa: "placa",
      plate: "placa",
      anoFabricacao: "anoFabricacao",
      anoModelo: "anoModelo",
      km: "km",
      mileage: "km",
      cor: "cor",
      color: "cor",
      observacoes: "observacoes",
      notes: "observacoes",
      status: "status",
    };
    for (const [source, target] of Object.entries(map)) {
      if (input[source] !== undefined) update[target] = input[source];
    }
    if (update.placa) update.placa = String(update.placa).toUpperCase();
    if (input.avarias !== undefined || input.damages !== undefined) {
      const values = input.avarias ?? input.damages;
      update.avarias = Array.isArray(values)
        ? values.map((item) =>
            typeof item === "string" ? { descricao: item, data: new Date() } : item,
          )
        : [];
    }
    if (input.fotos !== undefined || input.photoUrl !== undefined) {
      update.fotos = normalizeImagePayload(input.fotos ?? (input.photoUrl ? [input.photoUrl] : []));
    }
    const veiculo = await Veiculo.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });
    if (update.status && update.status !== statusAnterior) {
      await HistoricoStatus.create({
        veiculoId: id,
        statusAnterior,
        statusNovo: update.status,
        alteradoPor: user.id,
        observacao: String(input.observacao ?? "Atualizacao administrativa"),
      });
    }
    return ok({ veiculo: sanitizeDoc(veiculo) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Veiculo");
    await Veiculo.findByIdAndDelete(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleError(error);
  }
}

