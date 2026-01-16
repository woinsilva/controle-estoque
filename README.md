# Controle de Estoque e Vendas

Sistema de controle de estoque, vendas e usuarios com autenticação JWT e RBAC.

## Stack

- Frontend: Vue 3 + TypeScript + Vite
- Backend: Node.js + TypeScript + Express
- Banco: MongoDB + Mongoose
- Auth: JWT + RBAC (Operador, Gerente, Administrador)

## Estrutura

- `frontend/` Aplicacao web (Vue 3)
- `backend/` API REST (Express)
- `docs/` Documentacao e diagramas

## Setup rapido

1) Backend
```powershell
cd "C:\Dev\Controle de estoque\backend"
copy .env.example .env
npm install
npm run seed:admin
npm run dev
```

2) Frontend
```powershell
cd "C:\Dev\Controle de estoque\frontend"
npm install
npm run dev
```

## Credenciais iniciais

- Email: `admin@empresa.com`
- Senha: `Admin123!`

## Variaveis de ambiente (backend)

Veja `backend/.env.example` para todos os campos.

## Scripts principais

Backend:
- `npm run dev` inicia API em modo dev
- `npm run seed:admin` cria/atualiza admin inicial
- `npm run build` gera build

Frontend:
- `npm run dev` inicia Vite
- `npm run build` gera build

## Diagramas e fluxos

Consulte `docs/architecture.md` e `docs/flows.md`.
