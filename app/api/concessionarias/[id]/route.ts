import { NextRequest } from "next/server";
import { handleError, ok, requireObjectId, sanitizeDoc } from "../../../../lib/api";
import { requireAuth } from "../../../../lib/auth";
import { connectMongo } from "../../../../lib/mongodb";
import Concessionaria from "../../../../models/Concessionaria";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ["administrador"]);
    await connectMongo();
    const { id } = await context.params;
    requireObjectId(id, "Concessionaria");
    const input = await request.json();
    const concessionaria = await Concessionaria.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    });
    return ok({ concessionaria: sanitizeDoc(concessionaria) });
  } catch (error) {
    return handleError(error);
  }
}

