const STATUS_VALIDOS = ["disponivel", "reservado", "vendido"];

// O estado no escopo do modulo pode sobreviver entre chamadas quentes da funcao.
// Ele e apenas demonstrativo: instancias serverless podem reiniciar a qualquer momento.
let veiculos = [
  {
    id: "1",
    marca: "Toyota",
    modelo: "Corolla XEi",
    ano: 2022,
    km: 28400,
    avarias: ["Pequeno risco no para-choque traseiro"],
    observacoes: "Revisoes em dia e chave reserva.",
    fotos: ["https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=900&q=80"],
    status: "disponivel"
  },
  {
    id: "2",
    marca: "Volkswagen",
    modelo: "T-Cross Comfortline",
    ano: 2023,
    km: 17300,
    avarias: [],
    observacoes: "Laudo cautelar aprovado.",
    fotos: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=900&q=80"],
    status: "reservado"
  }
];

function lerBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

function texto(value) {
  return typeof value === "string" ? value.trim() : "";
}

function listaDeTextos(value) {
  return Array.isArray(value) ? value.map(texto).filter(Boolean) : [];
}

function criarId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Allow", "GET, POST, PATCH");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const perfil = texto(req.query?.perfil).toLowerCase();

    if (perfil && !["vendedor", "admin"].includes(perfil)) {
      return res.status(400).json({ erro: "Perfil deve ser vendedor ou admin." });
    }

    const resultado = perfil === "vendedor"
      ? veiculos.filter((veiculo) => veiculo.status === "disponivel")
      : veiculos;

    return res.status(200).json({ veiculos: resultado });
  }

  if (req.method === "POST") {
    const body = lerBody(req);
    if (!body) return res.status(400).json({ erro: "JSON invalido." });

    const marca = texto(body.marca);
    const modelo = texto(body.modelo);
    const ano = Number(body.ano);
    const km = Number(body.km);
    const status = texto(body.status) || "disponivel";

    if (!marca || !modelo || !Number.isInteger(ano) || ano < 1900 || ano > 2100) {
      return res.status(400).json({ erro: "Marca, modelo e ano valido sao obrigatorios." });
    }
    if (!Number.isFinite(km) || km < 0 || !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({ erro: "Quilometragem ou status invalido." });
    }

    const novoVeiculo = {
      id: criarId(),
      marca,
      modelo,
      ano,
      km: Math.round(km),
      avarias: listaDeTextos(body.avarias),
      observacoes: texto(body.observacoes),
      fotos: listaDeTextos(body.fotos),
      status
    };

    veiculos.unshift(novoVeiculo);
    return res.status(201).json({ veiculo: novoVeiculo });
  }

  if (req.method === "PATCH") {
    const body = lerBody(req);
    if (!body) return res.status(400).json({ erro: "JSON invalido." });

    const id = texto(body.id || req.query?.id);
    const indice = veiculos.findIndex((veiculo) => veiculo.id === id);
    if (indice < 0) return res.status(404).json({ erro: "Veiculo nao encontrado." });

    if (body.status !== undefined) {
      const status = texto(body.status);
      if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ erro: "Status invalido." });
      }
      veiculos[indice].status = status;
    }

    if (body.avaria !== undefined) {
      const avaria = texto(body.avaria);
      if (!avaria) return res.status(400).json({ erro: "Avaria nao pode ser vazia." });
      veiculos[indice].avarias.push(avaria);
    }

    if (body.status === undefined && body.avaria === undefined) {
      return res.status(400).json({ erro: "Informe status ou avaria para atualizar." });
    }

    return res.status(200).json({ veiculo: veiculos[indice] });
  }

  return res.status(405).json({ erro: "Metodo nao permitido." });
};
