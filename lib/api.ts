import { NextResponse } from "next/server";
import mongoose from "mongoose";

export type Perfil = "administrador" | "vendedor";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return NextResponse.json({ error: "Registro duplicado." }, { status: 409 });
  }

  const message = error instanceof Error ? error.message : "Erro interno.";
  return NextResponse.json({ error: message }, { status: 500 });
}

export function requireObjectId(id: string, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `${label} invalido.`);
  }
  return id;
}

export function sanitizeDoc<T extends { toObject?: () => Record<string, unknown> }>(doc: T) {
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return JSON.parse(JSON.stringify(plain));
}

