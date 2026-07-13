import mongoose, { Schema } from "mongoose";

const AvariaSchema = new Schema(
  {
    descricao: { type: String, required: true, trim: true },
    data: { type: Date, default: Date.now },
  },
  { _id: false },
);

const FotoSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const VeiculoSchema = new Schema(
  {
    marca: { type: String, required: true, trim: true },
    modelo: { type: String, required: true, trim: true },
    versao: { type: String, trim: true },
    placa: { type: String, required: true, unique: true, trim: true, uppercase: true },
    anoFabricacao: { type: Number, required: true },
    anoModelo: { type: Number, required: true },
    km: { type: Number, required: true, min: 0 },
    cor: { type: String, default: "#69706f" },
    avarias: { type: [AvariaSchema], default: [] },
    observacoes: { type: String, default: "" },
    fotos: { type: [FotoSchema], default: [] },
    status: {
      type: String,
      enum: ["cadastrado", "disponivel", "reservado", "vendido"],
      default: "cadastrado",
      required: true,
    },
    cadastradoPor: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
  },
  { timestamps: true },
);

export default mongoose.models.Veiculo || mongoose.model("Veiculo", VeiculoSchema);

