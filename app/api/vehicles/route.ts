import { getStore, isStatus, normalizeVehicleInput } from "../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const store = getStore();
  const vehicles = store.vehicles
    .filter((vehicle) => !status || !isStatus(status) || vehicle.status === status)
    .filter((vehicle) => {
      if (!search) return true;
      return `${vehicle.brand} ${vehicle.model} ${vehicle.plate}`
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => a.status.localeCompare(b.status) || b.updatedAt.localeCompare(a.updatedAt));

  return Response.json({ vehicles });
}

export async function POST(request: Request) {
  const input = (await request.json()) as Record<string, unknown>;
  const values = normalizeVehicleInput(input);
  if (!values) {
    return Response.json({ error: "Preencha corretamente os campos obrigatorios." }, { status: 400 });
  }

  const store = getStore();
  if (store.vehicles.some((vehicle) => vehicle.plate === values.plate)) {
    return Response.json({ error: "Ja existe um veiculo com esta placa." }, { status: 409 });
  }

  const timestamp = new Date().toISOString();
  const vehicle = {
    id: store.nextId++,
    ...values,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.vehicles.push(vehicle);

  return Response.json({ vehicle }, { status: 201 });
}
