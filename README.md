# Portal AutoEstoque

Portal mobile-first para gestao e consulta de estoque de veiculos. A aplicacao roda em Next.js no Vercel e usa MongoDB Atlas com Mongoose para persistencia.

## Stack

- Node.js 22+
- Next.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- dotenv

## Configuracao

1. Instale as dependencias:

```bash
npm install
```

2. Crie um arquivo `.env.local` a partir de `.env.example`.

3. Preencha as variaveis:

```env
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=8h
ADMIN_NOME=
ADMIN_EMAIL=
ADMIN_SENHA=
VENDEDOR_NOME=
VENDEDOR_EMAIL=
VENDEDOR_SENHA=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

No Vercel, cadastre essas variaveis em Project Settings > Environment Variables.

## Como obter a MONGODB_URI

1. Acesse MongoDB Atlas.
2. Crie um cluster.
3. Em Database Access, crie um usuario com senha.
4. Em Network Access, libere o IP usado pelo ambiente ou use `0.0.0.0/0` apenas se aceitar esse risco.
5. Clique em Connect > Drivers.
6. Copie a string `mongodb+srv://...`.
7. Substitua usuario, senha e nome do banco, por exemplo:

```env
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/portal-autoestoque?retryWrites=true&w=majority
```

## Seed

Depois de configurar as variaveis:

```bash
npm run seed
```

O seed cria:

- administrador inicial
- concessionaria inicial
- vendedor inicial
- veiculos de demonstracao

As credenciais iniciais vem das variaveis `ADMIN_*` e `VENDEDOR_*`.

## Comandos

```bash
npm run dev      # ambiente local
npm run build    # build de producao usado pelo Vercel
npm test         # build/check atual
npm run seed     # popula MongoDB Atlas
```

## Permissoes

Administrador:

- visualiza todos os veiculos
- cadastra, edita e remove veiculos
- altera status
- visualiza historico
- cadastra usuarios e concessionarias

Vendedor:

- visualiza somente veiculos disponiveis
- consulta detalhes e avarias
- cria reservas
- nao acessa dados administrativos

As permissoes sao validadas no backend via JWT e perfil.

## Imagens

O MongoDB armazena apenas URL e identificador publico. A camada `services/cloudinary.ts` prepara a integracao com Cloudinary. Enquanto as credenciais nao forem configuradas, o cadastro aceita URL direta de imagem.

## Endpoints principais

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/usuarios`
- `GET /api/usuarios`
- `PATCH /api/usuarios/:id`
- `POST /api/concessionarias`
- `GET /api/concessionarias`
- `PATCH /api/concessionarias/:id`
- `POST /api/veiculos`
- `GET /api/veiculos`
- `GET /api/veiculos/:id`
- `PATCH /api/veiculos/:id`
- `DELETE /api/veiculos/:id`
- `PATCH /api/veiculos/:id/status`
- `GET /api/veiculos/:id/historico`
- `POST /api/reservas`
- `GET /api/reservas`
- `PATCH /api/reservas/:id/status`

## Observacoes

O backend usa MongoDB Atlas via Mongoose. Nao coloque credenciais no codigo nem commite `.env.local`.
