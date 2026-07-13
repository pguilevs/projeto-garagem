"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Perfil = "administrador" | "vendedor";
type Status = "cadastrado" | "disponivel" | "reservado" | "vendido";
type Usuario = { id: string; nome: string; email: string; perfil: Perfil };
type Veiculo = {
  _id: string;
  marca: string;
  modelo: string;
  versao?: string;
  placa: string;
  anoFabricacao: number;
  anoModelo: number;
  km: number;
  cor: string;
  avarias: { descricao: string; data?: string }[];
  observacoes: string;
  fotos: { url: string; publicId?: string }[];
  status: Status;
};
type Draft = {
  marca: string;
  modelo: string;
  versao: string;
  placa: string;
  anoFabricacao: number;
  anoModelo: number;
  km: number;
  cor: string;
  status: Status;
  avariasText: string;
  observacoes: string;
  fotoUrl: string;
};

const labels: Record<Status, string> = {
  cadastrado: "Cadastrado",
  disponivel: "Disponivel",
  reservado: "Reservado",
  vendido: "Vendido",
};

const emptyDraft: Draft = {
  marca: "",
  modelo: "",
  versao: "",
  placa: "",
  anoFabricacao: new Date().getFullYear(),
  anoModelo: new Date().getFullYear(),
  km: 0,
  cor: "#69706f",
  status: "cadastrado",
  avariasText: "",
  observacoes: "",
  fotoUrl: "",
};

function CarArt({ vehicle }: { vehicle: Veiculo }) {
  const photo = vehicle.fotos?.[0]?.url;
  if (photo) {
    return (
      <div className="car-art photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={`${vehicle.marca} ${vehicle.modelo}`} />
      </div>
    );
  }

  return (
    <div className="car-art" style={{ "--car-color": vehicle.cor } as React.CSSProperties}>
      <span />
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("autoestoque_token") || "",
  );
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginError, setLoginError] = useState("");
  const [vehicles, setVehicles] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const [selected, setSelected] = useState<Veiculo | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = usuario?.perfil === "administrador";
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };
  const authHeaders = useMemo(
    () => ({
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    }),
    [token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (isAdmin && filter !== "todos") params.set("status", filter);
      const res = await fetch(`/api/veiculos?${params.toString()}`, {
        cache: "no-store",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setVehicles(data.veiculos);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Nao foi possivel atualizar o estoque");
    } finally {
      setLoading(false);
    }
  }, [filter, isAdmin, query, token]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/me", { headers: { authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setUsuario(data.usuario);
      })
      .catch(() => {
        window.localStorage.removeItem("autoestoque_token");
        setToken("");
      });
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load, token, usuario?.perfil, filter]);

  const visible = useMemo(
    () =>
      vehicles.filter((v) =>
        `${v.marca} ${v.modelo} ${v.placa}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [vehicles, query],
  );
  const count = (status: Status) => vehicles.filter((v) => v.status === status).length;
  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setError("");
    setFormOpen(true);
  };
  const openEdit = (v: Veiculo) => {
    setEditingId(v._id);
    setDraft({
      marca: v.marca,
      modelo: v.modelo,
      versao: v.versao || "",
      placa: v.placa,
      anoFabricacao: v.anoFabricacao,
      anoModelo: v.anoModelo,
      km: v.km,
      cor: v.cor,
      status: v.status,
      avariasText: v.avarias.map((a) => a.descricao).join("\n"),
      observacoes: v.observacoes || "",
      fotoUrl: v.fotos?.[0]?.url || "",
    });
    setSelected(null);
    setError("");
    setFormOpen(true);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        avarias: draft.avariasText
          .split("\n")
          .map((descricao) => descricao.trim())
          .filter(Boolean)
          .map((descricao) => ({ descricao, data: new Date().toISOString() })),
        fotos: draft.fotoUrl ? [{ url: draft.fotoUrl }] : [],
      };
      const res = await fetch(editingId ? `/api/veiculos/${editingId}` : "/api/veiculos", {
        method: editingId ? "PATCH" : "POST",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFormOpen(false);
      await load();
      notify(editingId ? "Veiculo atualizado" : "Veiculo cadastrado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel salvar");
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = async (v: Veiculo, status: Status) => {
    const res = await fetch(`/api/veiculos/${v._id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setSelected(null);
      await load();
      notify(`Status alterado para ${labels[status]}`);
    } else notify("Nao foi possivel alterar o status");
  };
  const reserve = async (v: Veiculo) => {
    const res = await fetch("/api/reservas", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ veiculoId: v._id, observacao: "Interesse registrado pelo portal" }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setSelected(null);
      await load();
      notify("Reserva registrada com sucesso");
    } else notify(data.error || "Nao foi possivel reservar");
  };
  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: loginEmail, senha: loginSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.localStorage.setItem("autoestoque_token", data.token);
      setToken(data.token);
      setUsuario(data.usuario);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Falha no login");
    }
  };
  const logout = () => {
    window.localStorage.removeItem("autoestoque_token");
    setToken("");
    setUsuario(null);
    setVehicles([]);
  };

  if (!usuario) {
    return (
      <main className="app-shell login-shell">
        <form className="login-card" onSubmit={login}>
          <div className="brand">
            Auto<span>Estoque</span>
          </div>
          <h1>Acesse o portal</h1>
          <p>Entre com seu usuario para visualizar o estoque permitido para seu perfil.</p>
          <label>
            Email
            <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" required />
          </label>
          <label>
            Senha
            <input value={loginSenha} onChange={(e) => setLoginSenha(e.target.value)} type="password" required />
          </label>
          {loginError && <p className="form-error">{loginError}</p>}
          <button className="primary full">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          Auto<span>Estoque</span>
        </div>
        <div className="user-chip">
          <b>{usuario.nome}</b>
          <small>{usuario.perfil}</small>
        </div>
        {isAdmin && (
          <button className="primary desktop-action" onClick={openCreate}>
            + Cadastrar veiculo
          </button>
        )}
        <button className="logout" onClick={logout}>
          Sair
        </button>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">{isAdmin ? "GESTAO DA FROTA" : "CATALOGO DA CONCESSIONARIA"}</p>
          <h1>{isAdmin ? "Visao geral do estoque" : "Encontre o carro certo"}</h1>
          <p>
            {isAdmin
              ? "Cadastre, acompanhe e atualize o fluxo de venda."
              : "Estoque disponivel para consulta e reserva."}
          </p>
        </div>
        <button className="sync" onClick={load}>
          <i /> Atualizar estoque
        </button>
      </section>
      {isAdmin && (
        <section className="kpis" aria-label="Resumo do estoque">
          <button onClick={() => setFilter("disponivel")}>
            <span>Disponiveis</span>
            <strong>{count("disponivel")}</strong>
            <small>Prontos para venda</small>
          </button>
          <button onClick={() => setFilter("reservado")}>
            <span>Reservados</span>
            <strong>{count("reservado")}</strong>
            <small>Aguardando confirmacao</small>
          </button>
          <button onClick={() => setFilter("vendido")}>
            <span>Vendidos</span>
            <strong>{count("vendido")}</strong>
            <small>Historico da frota</small>
          </button>
        </section>
      )}
      <section className="toolbar">
        <label className="search">
          <span>*</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Buscar marca, modelo ou placa"
          />
        </label>
        {isAdmin && (
          <button className="filter-trigger" onClick={() => setShowFilters(!showFilters)}>
            Filtros <b>{filter !== "todos" ? "1" : ""}</b>
          </button>
        )}
        {showFilters && isAdmin && (
          <div className="filter-sheet">
            <div>
              <strong>Filtrar por status</strong>
              <button onClick={() => setShowFilters(false)}>x</button>
            </div>
            {(["todos", "cadastrado", "disponivel", "reservado", "vendido"] as const).map((item) => (
              <button
                key={item}
                className={filter === item ? "selected" : ""}
                onClick={() => {
                  setFilter(item);
                  setShowFilters(false);
                }}
              >
                {item === "todos" ? "Todos os veiculos" : labels[item]}
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="inventory">
        <div className="section-title">
          <div>
            <h2>{isAdmin ? "Veiculos da frota" : "Disponiveis para venda"}</h2>
            <p>{loading ? "Atualizando..." : `${visible.length} veiculo${visible.length !== 1 ? "s" : ""} encontrado${visible.length !== 1 ? "s" : ""}`}</p>
          </div>
        </div>
        {loading ? (
          <div className="skeleton-grid">
            <i />
            <i />
            <i />
            <i />
          </div>
        ) : (
          <div className="vehicle-grid">
            {visible.map((v) => (
              <article className="vehicle-card" key={v._id} onClick={() => setSelected(v)} tabIndex={0}>
                <CarArt vehicle={v} />
                <div className="vehicle-main">
                  <div className="status-row">
                    <span className={`status ${v.status}`}>{labels[v.status]}</span>
                    <span className="year">{v.anoFabricacao}/{v.anoModelo}</span>
                  </div>
                  <h3>{v.marca} {v.modelo}</h3>
                  <div className="facts">
                    <span><small>Quilometragem</small>{v.km.toLocaleString("pt-BR")} km</span>
                    <span><small>Placa</small>{v.placa}</span>
                  </div>
                  {v.avarias.length ? <p className="damage">! {v.avarias.length} avaria(s)</p> : <p className="clean">Sem avarias registradas</p>}
                </div>
                <button className="details">Ver detalhes <span>-&gt;</span></button>
              </article>
            ))}
          </div>
        )}
        {!loading && !visible.length && (
          <div className="empty">
            <b>{vehicles.length ? "Nenhum veiculo encontrado" : "Estoque ainda vazio"}</b>
            <span>{vehicles.length ? "Tente remover os filtros ou alterar sua busca." : "Nao ha veiculos disponiveis para seu perfil."}</span>
            {isAdmin && !vehicles.length && <button className="primary" onClick={openCreate}>Cadastrar primeiro veiculo</button>}
          </div>
        )}
      </section>
      {isAdmin && <button className="fab" onClick={openCreate}>+</button>}
      <nav className="bottom-nav">
        <button className="active">Inicio</button>
        <button>Veiculos</button>
        <button onClick={() => notify("Relatorios entram na proxima versao")}>Relatorios</button>
        <button>Ajustes</button>
      </nav>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <article className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}>x</button>
            <CarArt vehicle={selected} />
            <span className={`status ${selected.status}`}>{labels[selected.status]}</span>
            <h2>{selected.marca} {selected.modelo}</h2>
            <p className="muted">{selected.anoFabricacao}/{selected.anoModelo} - {selected.km.toLocaleString("pt-BR")} km - {selected.placa}</p>
            <hr />
            <h3>Avarias informadas</h3>
            {selected.avarias.length ? <ul>{selected.avarias.map((a) => <li key={a.descricao}>{a.descricao}</li>)}</ul> : <p className="clean">Nenhuma avaria registrada</p>}
            <h3>Observacoes</h3>
            <p>{selected.observacoes || "Nenhuma observacao adicional."}</p>
            {isAdmin ? (
              <>
                <div className="status-actions">
                  {selected.status !== "disponivel" && <button onClick={() => changeStatus(selected, "disponivel")}>Disponibilizar</button>}
                  {selected.status === "disponivel" && <button onClick={() => changeStatus(selected, "reservado")}>Reservar</button>}
                  {selected.status === "reservado" && <button onClick={() => changeStatus(selected, "vendido")}>Concluir venda</button>}
                </div>
                <button className="primary full" onClick={() => openEdit(selected)}>Editar informacoes</button>
              </>
            ) : (
              <button className="primary full" onClick={() => reserve(selected)}>Registrar reserva</button>
            )}
          </article>
        </div>
      )}

      {formOpen && (
        <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
          <form className="vehicle-form" onSubmit={save} onClick={(e) => e.stopPropagation()}>
            <div className="form-head">
              <div>
                <p className="eyebrow">ADMINISTRATIVO</p>
                <h2>{editingId ? "Editar veiculo" : "Cadastrar veiculo"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>x</button>
            </div>
            <div className="form-grid">
              <label>Marca<input required value={draft.marca} onChange={(e) => setDraft({ ...draft, marca: e.target.value })} /></label>
              <label>Modelo<input required value={draft.modelo} onChange={(e) => setDraft({ ...draft, modelo: e.target.value })} /></label>
              <label>Versao<input value={draft.versao} onChange={(e) => setDraft({ ...draft, versao: e.target.value })} /></label>
              <label>Placa<input required maxLength={7} value={draft.placa} onChange={(e) => setDraft({ ...draft, placa: e.target.value.toUpperCase() })} /></label>
              <label>Ano fabricacao<input required type="number" value={draft.anoFabricacao} onChange={(e) => setDraft({ ...draft, anoFabricacao: Number(e.target.value) })} /></label>
              <label>Ano modelo<input required type="number" value={draft.anoModelo} onChange={(e) => setDraft({ ...draft, anoModelo: Number(e.target.value) })} /></label>
              <label>Quilometragem<input required type="number" min="0" value={draft.km} onChange={(e) => setDraft({ ...draft, km: Number(e.target.value) })} /></label>
              <label>Status<select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>{Object.entries(labels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            </div>
            <label>URL da foto<input value={draft.fotoUrl} onChange={(e) => setDraft({ ...draft, fotoUrl: e.target.value })} placeholder="https://..." /><small>Cloudinary pode ser conectado depois</small></label>
            <label>Avarias <small>uma por linha</small><textarea rows={3} value={draft.avariasText} onChange={(e) => setDraft({ ...draft, avariasText: e.target.value })} /></label>
            <label>Observacoes<textarea rows={3} value={draft.observacoes} onChange={(e) => setDraft({ ...draft, observacoes: e.target.value })} /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary full" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alteracoes" : "Cadastrar veiculo"}</button>
          </form>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
