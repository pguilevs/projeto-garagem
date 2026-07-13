import mongoose, { Schema } from "mongoose";

const ConcessionariaSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    cnpj: { type: String, required: true, trim: true },
    telefone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    ativa: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.Concessionaria ||
  mongoose.model("Concessionaria", ConcessionariaSchema);

