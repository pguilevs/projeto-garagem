import { NextRequest } from "next/server";
import { handleError, ok } from "../../../../lib/api";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    const usuario = await requireAuth(request);
    return ok({ usuario });
  } catch (error) {
    return handleError(error);
  }
}

