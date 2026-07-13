export type Status = "cadastrado" | "disponivel" | "reservado" | "vendido";

export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: string;
  mileage: number;
  plate: string;
  status: Status;
  damages: string[];
  notes: string;
  photoUrl: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type Store = {
  nextId: number;
  vehicles: Vehicle[];
};

const allowedStatuses = new Set<Status>([
  "cadastrado",
  "disponivel",
  "reservado",
  "vendido",
]);

const now = new Date().toISOString();

const initialVehicles: Vehicle[] = [
  {
    id: 1,
    brand: "Toyota",
    model: "Corolla XEi",
    year: "2022/2023",
    mileage: 38500,
    plate: "ABC1D23",
    status: "disponivel",
    damages: [],
    notes: "Unico dono, revisoes em dia.",
    photoUrl: null,
    color: "#69706f",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    brand: "Jeep",
    model: "Compass Longitude",
    year: "2021/2022",
    mileage: 52400,
    plate: "DEF4G56",
    status: "reservado",
    damages: ["Risco leve no para-choque traseiro"],
    notes: "Reserva aguardando confirmacao.",
    photoUrl: null,
    color: "#44524d",
    createdAt: now,
    updatedAt: now,
  },
];

const globalStore = globalThis as typeof globalThis & {
  __autoEstoqueStore?: Store;
};

export function getStore() {
  globalStore.__autoEstoqueStore ??= {
    nextId: initialVehicles.length + 1,
    vehicles: [...initialVehicles],
  };

  return globalStore.__autoEstoqueStore;
}

export function isStatus(value: string): value is Status {
  return allowedStatuses.has(value as Status);
}

export function normalizeVehicleInput(input: Record<string, unknown>) {
  const brand = String(input.brand ?? "").trim();
  const model = String(input.model ?? "").trim();
  const year = String(input.year ?? "").trim();
  const plate = String(input.plate ?? "").trim().toUpperCase();
  const mileage = Number(input.mileage);
  const status = String(input.status ?? "cadastrado");

  if (
    !brand ||
    !model ||
    !year ||
    !plate ||
    !Number.isFinite(mileage) ||
    mileage < 0 ||
    !isStatus(status)
  ) {
    return null;
  }

  return {
    brand,
    model,
    year,
    plate,
    mileage,
    status,
    damages: Array.isArray(input.damages) ? input.damages.map(String) : [],
    notes: String(input.notes ?? ""),
    photoUrl: input.photoUrl ? String(input.photoUrl) : null,
    color: String(input.color ?? "#69706f"),
  };
}
