import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { statusHistory, vehicles } from "../../../db/schema";

const allowedStatuses = new Set(["cadastrado", "disponivel", "reservado", "vendido"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim();
  const db = await getDb();
  const filters = [];
  if (status && allowedStatuses.has(status)) filters.push(eq(vehicles.status, status as "cadastrado"|"disponivel"|"reservado"|"vendido"));
  if (search) filters.push(or(like(vehicles.brand, `%${search}%`), like(vehicles.model, `%${search}%`), like(vehicles.plate, `%${search}%`))!);
  const rows = await db.select().from(vehicles).where(filters.length ? and(...filters) : undefined).orderBy(asc(vehicles.status), desc(vehicles.updatedAt));
  return Response.json({ vehicles: rows });
}

export async function POST(request: Request) {
  const input = await request.json() as Record<string, unknown>;
  const brand = String(input.brand ?? "").trim(); const model = String(input.model ?? "").trim();
  const year = String(input.year ?? "").trim(); const plate = String(input.plate ?? "").trim().toUpperCase();
  const mileage = Number(input.mileage); const status = String(input.status ?? "cadastrado");
  if (!brand || !model || !year || !plate || !Number.isFinite(mileage) || mileage < 0 || !allowedStatuses.has(status)) return Response.json({ error: "Preencha corretamente os campos obrigatórios." }, { status: 400 });
  try {
    const db = await getDb(); const now = new Date();
    const [vehicle] = await db.insert(vehicles).values({ brand, model, year, plate, mileage, status: status as any, damages: Array.isArray(input.damages) ? input.damages.map(String) : [], notes: String(input.notes ?? ""), photoUrl: input.photoUrl ? String(input.photoUrl) : null, color: String(input.color ?? "#69706f"), createdAt: now, updatedAt: now }).returning();
    await db.insert(statusHistory).values({ vehicleId: vehicle.id, previousStatus: null, newStatus: status, reason: "Cadastro inicial" });
    return Response.json({ vehicle }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao cadastrar";
    return Response.json({ error: message.includes("UNIQUE") ? "Já existe um veículo com esta placa." : message }, { status: 409 });
  }
}
