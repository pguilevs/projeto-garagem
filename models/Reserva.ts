import mongoose, { Schema } from "mongoose";

const ReservaSchema = new Schema(
  {
    veiculoId: { type: Schema.Types.ObjectId, ref: "Veiculo", required: true },
    vendedorId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    concessionariaId: { type: Schema.Types.ObjectId, ref: "Concessionaria", required: true },
    observacao: { type: String, default: "" },
    status: { type: String, enum: ["ativa", "cancelada", "concluida"], default: "ativa" },
    dataReserva: { type: Date, default: Date.now },
    dataEncerramento: { type: Date },
  },
  { timestamps: true },
);

ReservaSchema.index({ veiculoId: 1, status: 1 });

export default mongoose.models.Reserva || mongoose.model("Reserva", ReservaSchema);

