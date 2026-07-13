import { getStore, isStatus, normalizeVehicleInput } from "../../../../lib/store";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vehicleId = Number(id);
  const input = (await request.json()) as Record<string, unknown>;

  if (!Number.isInteger(vehicleId)) {
    return Response.json({ error: "ID invalido" }, { status: 400 });
  }

  const store = getStore();
  const current = store.vehicles.find((vehicle) => vehicle.id === vehicleId);
  if (!current) {
    return Response.json({ error: "Veiculo nao encontrado" }, { status: 404 });
  }

  const nextStatus = input.status ? String(input.status) : current.status;
  if (!isStatus(nextStatus)) {
    return Response.json({ error: "Status invalido" }, { status: 400 });
  }

  const values = normalizeVehicleInput({ ...current, ...input, status: nextStatus });
  if (!values) {
    return Response.json({ error: "Dados invalidos" }, { status: 400 });
  }

  if (store.vehicles.some((vehicle) => vehicle.id !== vehicleId && vehicle.plate === values.plate)) {
    return Response.json({ error: "Ja existe um veiculo com esta placa." }, { status: 409 });
  }

  const vehicle = { ...current, ...values, updatedAt: new Date().toISOString() };
  store.vehicles = store.vehicles.map((item) => (item.id === vehicleId ? vehicle : item));

  return Response.json({ vehicle });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vehicleId = Number(id);
  const store = getStore();
  store.vehicles = store.vehicles.filter((vehicle) => vehicle.id !== vehicleId);
  return new Response(null, { status: 204 });
}
