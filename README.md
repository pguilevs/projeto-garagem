# Portal AutoEstoque

Portal mobile-first para gestão e consulta de uma frota de veículos. O projeto possui uma visão administrativa para cadastrar e atualizar veículos e uma visão de vendedor que exibe somente o estoque disponível.

## Funcionalidades

- Catálogo responsivo com busca e filtros
- Perfis demonstrativos de Vendedor e Administrativo
- Cadastro e edição de veículos
- Status: cadastrado, disponível, reservado e vendido
- Histórico de mudanças de status
- Registro de quilometragem, placa, avarias e observações
- Upload e armazenamento de fotos
- Validação de placa duplicada
- Persistência em banco Cloudflare D1
- Armazenamento de imagens em Cloudflare R2

## Tecnologias

- React 19 e TypeScript
- Next.js/Vinext e Vite
- Cloudflare Workers
- Cloudflare D1 com Drizzle ORM
- Cloudflare R2

## Requisitos

- Node.js 22.13 ou superior
- npm
- Linux ou WSL para utilizar os scripts de desenvolvimento incluídos

## Executar localmente

```bash
npm install
npm run dev
```

Depois, abra o endereço informado no terminal. O ambiente local simula os vínculos de banco e armazenamento declarados em `.openai/hosting.json`.

## Comandos

```bash
npm run dev          # inicia o ambiente de desenvolvimento
npm run build        # gera e valida a versão de produção
npm test             # executa a validação automatizada
npm run lint         # verifica o código
npm run db:generate  # gera migrações após alterar o schema
```

## Estrutura principal

- `app/`: interface e rotas da API
- `db/`: conexão e modelo do banco
- `drizzle/`: migrações do banco
- `public/`: arquivos públicos
- `worker/`: entrada do Cloudflare Worker
- `tests/`: testes automatizados

## Observações

A alternância entre Vendedor e Administrativo ainda é demonstrativa. Antes do uso comercial, implemente autenticação real e autorização das rotas administrativas no servidor. Não envie arquivos `.env` ou credenciais para repositórios públicos.
