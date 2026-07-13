const API_URL = "/api/veiculos";
const pagina = document.body.dataset.page;
const feedback = document.querySelector("#feedback");

function escapar(valor = "") {
  return String(valor).replace(/[&<>'"]/g, (caractere) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[caractere]);
}

function urlSegura(valor) {
  try {
    const url = new URL(valor);
    return ["http:", "https:"].includes(url.protocol) ? escapar(url.href) : "";
  } catch {
    return "";
  }
}

function mensagem(texto, erro = false) {
  if (!feedback) return;
  feedback.textContent = texto;
  feedback.className = `feedback show${erro ? " error" : ""}`;
}

async function requisicao(url, opcoes = {}) {
  const resposta = await fetch(url, {
    ...opcoes,
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) }
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || "Nao foi possivel concluir a operacao.");
  return dados;
}

function formatarKm(km) {
  return `${Number(km).toLocaleString("pt-BR")} km`;
}

function fotoDoVeiculo(veiculo) {
  const foto = urlSegura(veiculo.fotos?.[0]);
  return foto
    ? `<img class="vehicle-photo" src="${foto}" alt="${escapar(`${veiculo.marca} ${veiculo.modelo}`)}" loading="lazy">`
    : '<div class="vehicle-photo photo-placeholder">Sem foto</div>';
}

async function carregarCatalogo() {
  const catalogo = document.querySelector("#catalogo");
  catalogo.innerHTML = '<div class="empty">Carregando estoque...</div>';
  try {
    const { veiculos } = await requisicao(`${API_URL}?perfil=vendedor`);
    catalogo.innerHTML = veiculos.length ? veiculos.map((veiculo) => `
      <article class="vehicle-card">
        ${fotoDoVeiculo(veiculo)}
        <div class="vehicle-content">
          <h2 class="vehicle-title">${escapar(veiculo.marca)} ${escapar(veiculo.modelo)}</h2>
          <p class="vehicle-meta">Pronto para negociação</p>
          <dl class="vehicle-details">
            <div><dt>Ano</dt><dd>${escapar(veiculo.ano)}</dd></div>
            <div><dt>Quilometragem</dt><dd>${formatarKm(veiculo.km)}</dd></div>
          </dl>
          ${veiculo.observacoes ? `<p class="notes">${escapar(veiculo.observacoes)}</p>` : ""}
        </div>
      </article>`).join("") : '<div class="empty">Nenhum veículo disponível neste momento.</div>';
  } catch (erro) {
    catalogo.innerHTML = '<div class="empty">Não foi possível carregar o catálogo.</div>';
    mensagem(erro.message, true);
  }
}

async function carregarAdmin() {
  const lista = document.querySelector("#admin-list");
  lista.innerHTML = '<div class="empty">Carregando estoque...</div>';
  try {
    const { veiculos } = await requisicao(`${API_URL}?perfil=admin`);
    document.querySelector("#total").textContent = `${veiculos.length} veículo(s)`;
    lista.innerHTML = veiculos.length ? veiculos.map((veiculo) => `
      <article class="admin-row">
        <div>
          <h3>${escapar(veiculo.marca)} ${escapar(veiculo.modelo)} · ${escapar(veiculo.ano)}</h3>
          <p><span class="status status-${escapar(veiculo.status)}">${escapar(veiculo.status)}</span>${formatarKm(veiculo.km)} · ${veiculo.avarias.length} avaria(s)</p>
          ${veiculo.avarias.length ? `<p>Avarias: ${veiculo.avarias.map(escapar).join("; ")}</p>` : ""}
        </div>
        <div class="admin-actions">
          <button class="button small secondary" data-action="status" data-id="${escapar(veiculo.id)}" data-value="disponivel">Disponível</button>
          <button class="button small secondary" data-action="status" data-id="${escapar(veiculo.id)}" data-value="reservado">Reservar</button>
          <button class="button small secondary" data-action="status" data-id="${escapar(veiculo.id)}" data-value="vendido">Vendido</button>
          <button class="button small primary" data-action="avaria" data-id="${escapar(veiculo.id)}">+ Avaria</button>
        </div>
      </article>`).join("") : '<div class="empty">Nenhum veículo cadastrado.</div>';
  } catch (erro) {
    lista.innerHTML = '<div class="empty">Não foi possível carregar o estoque.</div>';
    mensagem(erro.message, true);
  }
}

async function atualizarVeiculo(id, alteracao, botao) {
  botao.disabled = true;
  try {
    await requisicao(API_URL, { method: "PATCH", body: JSON.stringify({ id, ...alteracao }) });
    mensagem("Veículo atualizado com sucesso.");
    await carregarAdmin();
  } catch (erro) {
    mensagem(erro.message, true);
    botao.disabled = false;
  }
}

function iniciarAdmin() {
  const formulario = document.querySelector("#vehicle-form");
  const toggle = document.querySelector("#toggle-form");

  toggle.addEventListener("click", () => {
    const oculto = formulario.classList.toggle("hidden");
    toggle.textContent = oculto ? "Mostrar formulário" : "Ocultar formulário";
    toggle.setAttribute("aria-expanded", String(!oculto));
  });

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const botao = formulario.querySelector('[type="submit"]');
    const dados = new FormData(formulario);
    const linhas = (nome) => String(dados.get(nome) || "").split("\n").map((item) => item.trim()).filter(Boolean);
    const veiculo = {
      marca: dados.get("marca"), modelo: dados.get("modelo"), ano: Number(dados.get("ano")),
      km: Number(dados.get("km")), status: dados.get("status"), observacoes: dados.get("observacoes"),
      fotos: linhas("fotos"), avarias: linhas("avarias")
    };
    botao.disabled = true;
    try {
      await requisicao(API_URL, { method: "POST", body: JSON.stringify(veiculo) });
      formulario.reset();
      mensagem("Veículo cadastrado com sucesso.");
      await carregarAdmin();
    } catch (erro) {
      mensagem(erro.message, true);
    } finally {
      botao.disabled = false;
    }
  });

  document.querySelector("#admin-list").addEventListener("click", (evento) => {
    const botao = evento.target.closest("button[data-action]");
    if (!botao) return;
    if (botao.dataset.action === "status") {
      atualizarVeiculo(botao.dataset.id, { status: botao.dataset.value }, botao);
      return;
    }
    const avaria = window.prompt("Descreva a avaria encontrada:");
    if (avaria?.trim()) atualizarVeiculo(botao.dataset.id, { avaria: avaria.trim() }, botao);
  });

  carregarAdmin();
}

if (pagina === "vendedor") carregarCatalogo();
if (pagina === "admin") iniciarAdmin();
