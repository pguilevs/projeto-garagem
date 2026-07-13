import { NextRequest } from "next/server";
import { ApiError, handleError, ok, sanitizeDoc } from "../../../lib/api";
import { requireAuth } from "../../../lib/auth";
import { connectMongo } from "../../../lib/mongodb";
import Veiculo from "../../../models/Veiculo";
import HistoricoStatus from "../../../models/HistoricoStatus";
import { normalizeImagePayload } from "../../../services/cloudinary";

function vehiclePayload(input: Record<string, unknown>, userId: string) {
  const anoFabricacao = Number(input.anoFabricacao ?? input.year?.toString().split("/")[0]);
  const anoModelo = Number(input.anoModelo ?? input.year?.toString().split("/")[1] ?? anoFabricacao);
  return {
    marca: String(input.marca ?? input.brand ?? "").trim(),
    modelo: String(input.modelo ?? input.model ?? "").trim(),
    versao: String(input.versao ?? "").trim(),
    placa: String(input.placa ?? input.plate ?? "").trim().toUpperCase(),
    anoFabricacao,
    anoModelo,
    km: Number(input.km ?? input.mileage),
    cor: String(input.cor ?? input.color ?? "#69706f"),
    avarias: Array.isArray(input.avarias)
      ? input.avarias
      : Array.isArray(input.damages)
        ? input.damages.map((descricao) => ({ descricao: String(descricao), data: new Date() }))
        : [],
    observacoes: String(input.observacoes ?? input.notes ?? ""),
    fotos: normalizeImagePayload(input.fotos ?? (input.photoUrl ? [input.photoUrl] : [])),
    status: String(input.status ?? "cadastrado"),
    cadastradoPor: userId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectMongo();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");
    const filters: Record<string, unknown> = {};

    if (user.perfil === "vendedor") filters.status = "disponivel";
    else if (status) filters.status = status;
    if (search) {
      filters.$or = [
        { marca: new RegExp(search, "i") },
        { modelo: new RegExp(search, "i") },
        { placa: new RegExp(search, "i") },
      ];
    }

    const veiculos = await Veiculo.find(filters).sort({ updatedAt: -1 });
    return ok({ veiculos: veiculos.map(sanitizeDoc) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, ["administrador"]);
    await connectMongo();
    const input = (await request.json()) as Record<string, unknown>;
    const payload = vehiclePayload(input, user.id);
    if (!payload.marca || !payload.modelo || !payload.placa || !payload.anoFabricacao || !payload.anoModelo || !Number.isFinite(payload.km)) {
      throw new ApiError(400, "Preencha corretamente os campos obrigatorios.");
    }
    const veiculo = await Veiculo.create(payload);
    await HistoricoStatus.create({
      veiculoId: veiculo._id,
      statusAnterior: null,
      statusNovo: veiculo.status,
      alteradoPor: user.id,
      observacao: "Cadastro inicial",
    });
    return ok({ veiculo: sanitizeDoc(veiculo) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

