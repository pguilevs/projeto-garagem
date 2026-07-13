import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI nao configurada.");
  process.exit(1);
}

const usuarioSchema = new mongoose.Schema(
  {
    nome: String,
    email: { type: String, unique: true, lowercase: true },
    senha: { type: String, select: false },
    perfil: { type: String, enum: ["administrador", "vendedor"] },
    concessionariaId: { type: mongoose.Schema.Types.ObjectId, ref: "Concessionaria" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const concessionariaSchema = new mongoose.Schema(
  {
    nome: String,
    cnpj: String,
    telefone: String,
    email: String,
    ativa: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const veiculoSchema = new mongoose.Schema(
  {
    marca: String,
    modelo: String,
    versao: String,
    placa: { type: String, unique: true },
    anoFabricacao: Number,
    anoModelo: Number,
    km: Number,
    cor: String,
    avarias: [{ descricao: String, data: Date }],
    observacoes: String,
    fotos: [{ url: String, publicId: String }],
    status: String,
    cadastradoPor: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true },
);

const Usuario = mongoose.models.Usuario || mongoose.model("Usuario", usuarioSchema);
const Concessionaria =
  mongoose.models.Concessionaria || mongoose.model("Concessionaria", concessionariaSchema);
const Veiculo = mongoose.models.Veiculo || mongoose.model("Veiculo", veiculoSchema);

await mongoose.connect(uri);

const adminEmail = process.env.ADMIN_EMAIL || "admin@autoestoque.local";
const adminSenha = process.env.ADMIN_SENHA;
const vendedorEmail = process.env.VENDEDOR_EMAIL || "vendedor@autoestoque.local";
const vendedorSenha = process.env.VENDEDOR_SENHA;

if (!adminSenha || !vendedorSenha) {
  console.error("Configure ADMIN_SENHA e VENDEDOR_SENHA antes de rodar o seed.");
  process.exit(1);
}

const admin = await Usuario.findOneAndUpdate(
  { email: adminEmail.toLowerCase() },
  {
    nome: process.env.ADMIN_NOME || "Administrador",
    email: adminEmail.toLowerCase(),
    senha: await bcrypt.hash(adminSenha, 12),
    perfil: "administrador",
    ativo: true,
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const concessionaria = await Concessionaria.findOneAndUpdate(
  { cnpj: process.env.SEED_CONCESSIONARIA_CNPJ || "00.000.000/0001-00" },
  {
    nome: process.env.SEED_CONCESSIONARIA_NOME || "AutoEstoque Matriz",
    cnpj: process.env.SEED_CONCESSIONARIA_CNPJ || "00.000.000/0001-00",
    telefone: process.env.SEED_CONCESSIONARIA_TELEFONE || "",
    email: process.env.SEED_CONCESSIONARIA_EMAIL || "",
    ativa: true,
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

await Usuario.findOneAndUpdate(
  { email: vendedorEmail.toLowerCase() },
  {
    nome: process.env.VENDEDOR_NOME || "Vendedor Demo",
    email: vendedorEmail.toLowerCase(),
    senha: await bcrypt.hash(vendedorSenha, 12),
    perfil: "vendedor",
    concessionariaId: concessionaria._id,
    ativo: true,
  },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

const veiculos = [
  {
    marca: "Toyota",
    modelo: "Corolla",
    versao: "XEi",
    placa: "ABC1D23",
    anoFabricacao: 2022,
    anoModelo: 2023,
    km: 38500,
    cor: "#69706f",
    avarias: [],
    observacoes: "Unico dono, revisoes em dia.",
    status: "disponivel",
    cadastradoPor: admin._id,
  },
  {
    marca: "Jeep",
    modelo: "Compass",
    versao: "Longitude",
    placa: "DEF4G56",
    anoFabricacao: 2021,
    anoModelo: 2022,
    km: 52400,
    cor: "#44524d",
    avarias: [{ descricao: "Risco leve no para-choque traseiro", data: new Date() }],
    observacoes: "Reserva pendente de confirmacao.",
    status: "disponivel",
    cadastradoPor: admin._id,
  },
];

for (const veiculo of veiculos) {
  await Veiculo.findOneAndUpdate({ placa: veiculo.placa }, veiculo, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
}

await mongoose.disconnect();
console.log("Seed concluido.");

