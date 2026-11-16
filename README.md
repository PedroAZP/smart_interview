<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-000000?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/FastAPI-0.162-009688?logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.14-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Gemini_AI-2.5_Flash-8E75B2?logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" alt="SQLite" />
</p>

<h1 align="center">SmartInterview AI</h1>

<p align="center">
  <strong>Seu Tech Lead Pessoal — Simulador de Entrevistas Técnicas com IA</strong>
</p>

<p align="center">
  Plataforma que simula entrevistas técnicas reais com uma IA que assume o papel de Tech Lead sênior.<br/>
  O candidato cola a descrição da vaga, anexa o currículo e recebe uma entrevista personalizada<br/>
  com perguntas técnicas e comportamentais, seguida de um diagnóstico completo de desempenho.
</p>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tech Stack](#-tech-stack)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Endpoints da API](#-endpoints-da-api)
- [Licença](#-licença)

---

## 💡 Sobre o Projeto

O **SmartInterview AI** é uma ferramenta de simulação de entrevistas técnicas focada em candidatos de nível estágio, júnior ou em transição de carreira na área de tecnologia. A IA conduz a entrevista seguindo a metodologia de um Tech Lead real:

1. **Abertura** — cumprimento e convite para o candidato se apresentar
2. **Perguntas técnicas e comportamentais** — 6 a 8 perguntas progressivas baseadas na vaga e no currículo
3. **Aprofundamento** — follow-ups quando respostas são vagas ou superficiais
4. **Encerramento** — agradecimento e orientação para gerar o relatório

Ao final, o candidato pode gerar um **Diagnóstico de Desempenho** com:

- Nota geral (0-100)
- Pontuação por competências (Técnica, Comunicação, Alinhamento)
- Pontos fortes demonstrados
- Pontos cegos identificados
- Plano de ação e recomendações de estudo

---

## 🛠 Tech Stack

### Frontend

| Tecnologia
|
| [Next.js](https://nextjs.org/)  
| [React](https://react.dev/)  
| [TypeScript](https://www.typescriptlang.org/)  
| [Tailwind CSS](https://tailwindcss.com/)  
| [shadcn/ui](https://ui.shadcn.com/)  
| [Lucide React](https://lucide.dev/)  
| [class-variance-authority](https://cva.style/)

### Backend

| Tecnologia  
|
| [Python](https://www.python.org/)
| [FastAPI](https://fastapi.tiangolo.com/)
| [Uvicorn](https://www.uvicorn.org/)
| [SQLAlchemy](https://www.sqlalchemy.org/)
| [SQLite](https://www.sqlite.org/)
| [Pydantic](https://docs.pydantic.dev/)
| [Google GenAI SDK](https://ai.google.dev/)
| [PyPDF](https://pypdf.readthedocs.io/)
| [google-auth](https://google-auth.readthedocs.io/)

---

## 📦 Pré-requisitos

Certifique-se de ter instalado:

- **Node.js** 18+ → [nodejs.org](https://nodejs.org/)
- **Python** 3.12+ → [python.org](https://www.python.org/)
- **npm** (incluso com o Node.js)
- **Chave de API do Google Gemini** → [Google AI Studio](https://aistudio.google.com/apikey)

---

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/smart-interview.git
cd smart-interview
```

### 2. Configure o Frontend

```bash
# Instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env.local
```

Edite o `.env.local` com as suas configurações (veja [Variáveis de Ambiente](#-variáveis-de-ambiente)).

### 3. Configure o Backend

```bash
# Entre na pasta do backend
cd backend

# Crie e ative o ambiente virtual
python -m venv .venv

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Linux/macOS
source .venv/bin/activate

# Instale as dependências
pip install -r requirements.txt

# Copie o arquivo de variáveis de ambiente
cp app/.env.example .env
```

Edite o `backend/.env` com sua chave do Gemini e demais configurações.

---

## ▶️ Executando o Projeto

Você precisa de **dois terminais** rodando simultaneamente:

### Terminal 1 — Backend (FastAPI)

```bash
cd backend
.\.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate          # Linux/macOS

uvicorn app.main:app --reload
```

O servidor estará disponível em **http://localhost:8000**.
A documentação interativa da API (Swagger) estará em **http://localhost:8000/docs**.

### Terminal 2 — Frontend (Next.js)

```bash
npm run dev
```

A aplicação estará disponível em **http://localhost:3000**.

---

## 🔐 Variáveis de Ambiente

### Frontend (`.env.local`)

| Variável                       | Obrigatória | Funcionalidade                                            |
| ------------------------------ | ----------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | Sim         | URL base da API FastAPI (padrão: `http://localhost:8000`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Não         | Client ID do Google Cloud Console para login com Google   |

### Backend (`backend/.env`)

| Variável               | Obrigatória | Funcionalidade                                              |
| ---------------------- | ----------- | ----------------------------------------------------------- |
| `GEMINI_API_KEY`       | Sim         | Chave de API do Google Gemini                               |
| `GEMINI_MODEL`         | Sim         | Modelo do Gemini a utilizar (ex: `gemini-2.5-flash`)        |
| `JWT_SECRET`           | Sim         | Chave secreta para assinar tokens JWT (mude em produção!)   |
| `GOOGLE_CLIENT_ID`     | Não         | Google Client ID para validação server-side de tokens OAuth |
| `GOOGLE_CLIENT_SECRET` | Não         | Google Client Secret para OAuth                             |

---

## 📡 Endpoints da API

### Autenticação (`/auth`)

| Método | Rota             | Descrição                       | Autenticação |
| ------ | ---------------- | ------------------------------- | ------------ |
| `POST` | `/auth/register` | Cadastro de novo usuário        | Não          |
| `POST` | `/auth/login`    | Login com e-mail e senha        | Não          |
| `POST` | `/auth/google`   | Login/cadastro com Google OAuth | Não          |
| `GET`  | `/auth/me`       | Retorna dados do usuário logado | Bearer Token |

### Entrevistas (`/interviews`)

| Método | Rota                        | Descrição                              | Autenticação    |
| ------ | --------------------------- | -------------------------------------- | --------------- |
| `POST` | `/interviews`               | Cria nova entrevista                   | Não             |
| `GET`  | `/interviews`               | Lista histórico de entrevistas         | Query `user_id` |
| `GET`  | `/interviews/{id}/messages` | Busca mensagens de uma entrevista      | Não             |
| `POST` | `/interviews/{id}/reply`    | Gera resposta da IA (SSE streaming)    | Não             |
| `POST` | `/interviews/{id}/messages` | Envia mensagem e recebe resposta (SSE) | Não             |

### Relatórios (`/interviews`)

| Método | Rota                      | Descrição                            | Autenticação |
| ------ | ------------------------- | ------------------------------------ | ------------ |
| `POST` | `/interviews/{id}/report` | Gera diagnóstico de desempenho       | Bearer Token |
| `GET`  | `/interviews/{id}/report` | Busca relatório existente            | Bearer Token |
| `GET`  | `/interviews/reports/all` | Lista todos os relatórios do usuário | Bearer Token |

---

## 🗄️ Banco de Dados

O projeto utiliza **SQLite** com as seguintes tabelas:

| Tabela         | Descrição                                             |
| -------------- | ----------------------------------------------------- |
| `users`        | Usuários cadastrados (nome, e-mail, senha hash)       |
| `interviews`   | Sessões de entrevista (vaga, currículo, status, dono) |
| `messages`     | Mensagens do chat (role: `user` ou `model`)           |
| `reports`      | Diagnósticos de desempenho (notas, resumo)            |
| `report_items` | Itens do relatório (pontos fortes, cegos, melhorias)  |
| `files`        | Metadados de arquivos enviados (currículo, vaga)      |

O banco é criado automaticamente em `backend/app.db` na primeira execução.

---

## 🤖 Como a IA Funciona

O SmartInterview utiliza o **Google Gemini 2.5 Flash** com dois prompts especializados:

1. **Entrevistador** (`prompts/entrevistador.md`) — Conduz a entrevista como um Tech Lead sênior, seguindo um roteiro estruturado com abertura, perguntas progressivas, aprofundamento e encerramento.

2. **Avaliador** (`prompts/avaliador.md`) — Analisa o histórico completo da entrevista e gera um diagnóstico JSON com notas (0-100) por competência, pontos fortes, pontos cegos e recomendações de estudo.

As respostas são enviadas via **Server-Sent Events (SSE)** para exibição em tempo real no chat.

---

## 📄 Licença

Este projeto é de uso pessoal/educacional.
