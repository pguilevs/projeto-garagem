import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { statusHistory, vehicles } from "../../../../db/schema";

const allowed = new Set(["cadastrado", "disponivel", "reservado", "vendido"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const vehicleId = Number(id); const input = await request.json() as Record<string, unknown>;
  if (!Number.isInteger(vehicleId)) return Response.json({ error: "ID inválido" }, { status: 400 });
  const db = await getDb(); const [current] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
  if (!current) return Response.json({ error: "Veículo não encontrado" }, { status: 404 });
  const nextStatus = input.status ? String(input.status) : current.status;
  if (!allowed.has(nextStatus)) return Response.json({ error: "Status inválido" }, { status: 400 });
  const values = {
    brand: input.brand === undefined ? current.brand : String(input.brand).trim(), model: input.model === undefined ? current.model : String(input.model).trim(),
    year: input.year === undefined ? current.year : String(input.year).trim(), mileage: input.mileage === undefined ? current.mileage : Number(input.mileage),
    plate: input.plate === undefined ? current.plate : String(input.plate).trim().toUpperCase(), status: nextStatus as any,
    damages: input.damages === undefined ? current.damages : (Array.isArray(input.damages) ? input.damages.map(String) : []),
    notes: input.notes === undefined ? current.notes : String(input.notes), photoUrl: input.photoUrl === undefined ? current.photoUrl : (input.photoUrl ? String(input.photoUrl) : null),
    color: input.color === undefined ? current.color : String(input.color), updatedAt: new Date(),
  };
  if (!values.brand || !values.model || !values.year || !values.plate || !Number.isFinite(values.mileage) || values.mileage < 0) return Response.json({ error: "Dados inválidos" }, { status: 400 });
  const [vehicle] = await db.update(vehicles).set(values).where(eq(vehicles.id, vehicleId)).returning();
  if (nextStatus !== current.status) await db.insert(statusHistory).values({ vehicleId, previousStatus: current.status, newStatus: nextStatus, reason: String(input.reason ?? "Atualização administrativa") });
  return Response.json({ vehicle });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; const vehicleId = Number(id); const db = await getDb();
  await db.delete(vehicles).where(eq(vehicles.id, vehicleId)); return new Response(null, { status: 204 });
}
