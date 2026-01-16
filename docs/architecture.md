# Arquitetura do Sistema de Controle de Estoque e Vendas

Este documento define a arquitetura geral, padrões e convenções iniciais para
guiar a implementacao do sistema.

## Visao geral

- Frontend: Vue 3 + TypeScript + Vite, SPA, consumo de API REST.
- Backend: Node.js + TypeScript, Express (ou Fastify) com camadas claras.
- Banco: MongoDB com Mongoose.
- Auth: JWT com RBAC (Operador, Gerente, Administrador).
- Preparacao NF-e: modulo isolado com contratos e fila de eventos.

## Decisoes principais

- Estilo de API: REST, versionada em `/api/v1`.
- Autenticacao: JWT (access token) com refresh token opcional.
- Autorizacao: RBAC via middleware, por papel.
- Banco: MongoDB + Mongoose com schemas tipados.
- Validacao: Zod (ou Joi) no backend; DTOs no frontend.

## Padroes adotados

- Camadas: Controller -> Service -> Repository -> Model.
- Responsabilidades:
  - Controller: orquestra request/response, sem regra de negocio.
  - Service: regra de negocio e validacoes.
  - Repository: acesso ao banco e consultas.
  - Model: schemas Mongoose e mapeamento de documentos.
- Tratamento de erros centralizado em middleware.
- Middlewares separados para auth e roles.

## Convencoes de pastas

### Frontend (frontend/)

- `src/`
- `src/app/` (bootstrap, router, store)
- `src/modules/` (feature-first: products, sales, users, auth)
- `src/components/` (shared)
- `src/services/` (API clients)
- `src/types/` (interfaces, DTOs)
- `src/styles/` (tokens, theme, base)

### Backend (backend/)

- `src/`
- `src/config/` (env, db, jwt)
- `src/modules/`
- `src/modules/{feature}/`
- `src/modules/{feature}/controller.ts`
- `src/modules/{feature}/service.ts`
- `src/modules/{feature}/repository.ts`
- `src/modules/{feature}/model.ts`
- `src/modules/{feature}/routes.ts`
- `src/middlewares/` (auth, rbac, error)
- `src/shared/` (utils, errors, types)
- `src/app.ts` (express app)
- `src/server.ts` (bootstrap)

## Modulos iniciais

- auth (login, refresh, roles)
- users (cadastro e gestao de usuarios)
- products (cadastro de produtos)
- inventory (movimentacoes de estoque)
- sales (registro de vendas)

## Preparacao para NF-e

- Criar modulo `nfe` isolado com interfaces e eventos.
- Evitar acoplamento nas rotas de vendas.
- Registrar eventos de venda em uma fila para futura emissao.

## Documentacao

- README: `README.md`
- Diagramas: `docs/diagrams.md`
- Fluxos: `docs/flows.md`

## Proximos passos (Tarefas seguintes)

- Definir contratos de API e entidades (DTOs e schemas).
- Montar estrutura de projetos `frontend` e `backend`.
- Implementar autenticacao e RBAC.
