import { NextRequest } from "next/server";
import { handleError, ok, requireObjectId } from "../../../../../lib/api";
import { requireAuth } from "../../../../../lib/auth";
import { connectMongo } from "../../../../../lib/mongodb";
import HistoricoStatus from "../../../../../models/HistoricoStatus";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Veiculo");
    const historico = await HistoricoStatus.find({ veiculoId: id }).sort({ dataAlteracao: -1 });
    return ok({ historico });
  } catch (error) {
    return handleError(error);
  }
}

