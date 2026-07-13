import mongoose, { Schema } from "mongoose";

const HistoricoStatusSchema = new Schema(
  {
    veiculoId: { type: Schema.Types.ObjectId, ref: "Veiculo", required: true },
    statusAnterior: { type: String },
    statusNovo: { type: String, required: true },
    alteradoPor: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    observacao: { type: String, default: "" },
    dataAlteracao: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.models.HistoricoStatus ||
  mongoose.model("HistoricoStatus", HistoricoStatusSchema);

