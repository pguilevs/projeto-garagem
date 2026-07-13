import mongoose, { Schema } from "mongoose";

const UsuarioSchema = new Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    senha: { type: String, required: true, select: false },
    perfil: { type: String, enum: ["administrador", "vendedor"], required: true },
    concessionariaId: { type: Schema.Types.ObjectId, ref: "Concessionaria" },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.models.Usuario || mongoose.model("Usuario", UsuarioSchema);

