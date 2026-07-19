# ✚ Passagem de Plantão — Sistema de Gestão Hospitalar

> Nome anterior do projeto: MedControl.

> Projeto desenvolvido com Claude (claude.ai) e pronto para evolução no **Claude Code**.

---

## 📋 Sobre o Projeto

O **MedControl** é um sistema web de acompanhamento de pacientes internados, desenvolvido para hospitais com até 100 leitos. Foi construído como um único arquivo HTML com JavaScript puro, otimizado para uso no **Safari do iPhone** (sem necessidade de app store).

---

## 📁 Estrutura Atual do Projeto

```
medcontrol/
├── index.html                    ← Arquivo principal (abrir no navegador)
├── manifest.json                 ← Metadados de instalação (PWA)
├── service-worker.js             ← Cache offline (PWA)
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   └── apple-touch-icon.png
└── README.md                     ← Este arquivo
```

O projeto agora é um **PWA (Progressive Web App)**: pode ser instalado na tela de início (Android/iOS/desktop) e funciona offline depois do primeiro carregamento, além do modo "abrir o HTML direto" que já existia.

---

## ✅ Funcionalidades Já Implementadas

### Painel (Dashboard)
- Visão geral em tempo real: leitos ocupados/livres (de 100), ATB, transferências, pendências
- Cards com contagem de internações longas (≥14 dias) e sem previsão de alta
- Lista dos pacientes mais recentes

### Pacientes Internados
- Cadastro completo: nome, leito, idade, ala/setor
- **Contagem automática de dias de internação** (verde < 7d, amarelo < 14d, vermelho ≥ 14d)
- Busca por nome, leito ou patologia
- Filtro por ala: UTI, Clínica Médica, Cirurgia, Pediatria, Obs/Maternidade

### Medicações
- Lista completa de medicações em uso
- Registro de posologia e frequência

### Antibioticoterapia (ATB)
- Aba exclusiva com todos os pacientes em ATB
- **Contagem de dias de antibiótico (D1, D2, D3...)** com alerta de cor por tempo de uso

### Pendências
- Lista de pendências por paciente
- Botão de resolução com um toque (salva automaticamente)

### Previsão de Alta
- Ordenação cronológica por data prevista
- Alertas visuais: alta hoje, atrasada, nos próximos dias

### Transferências — Central de Leitos
- Aba exclusiva com pacientes aguardando transferência
- **Número do FastMedic** (protocolo) em destaque
- Hospital de destino e status da solicitação

### Salvamento Local
- Dados salvos automaticamente no `localStorage` do navegador
- Persistência entre sessões (dados não se perdem ao fechar o Safari)
- Botão de reset para voltar aos dados de exemplo

### Interface Mobile (Safari/iPhone)
- Navegação por **abas na parte inferior** (padrão iOS)
- **Bottom sheets** animados para detalhes e formulários (padrão iOS)
- Layout responsivo: funciona em telefone e desktop
- `apple-mobile-web-app-capable`: pode ser adicionado à tela inicial como app
- `viewport-fit=cover`: respeita o notch e o Dynamic Island do iPhone
- `safe-area-inset`: não fica atrás da barra de navegação do iOS

---

## 🚀 Como Usar Agora (sem backend)

### No iPhone (Safari):
1. Abra o arquivo `index.html` no Safari
2. Toque em **Compartilhar** → **"Adicionar à Tela de Início"**
3. O app aparece como ícone, funciona como app nativo
4. Dados ficam salvos no dispositivo automaticamente

### No computador:
1. Abra `index.html` em qualquer navegador
2. Funciona imediatamente, sem servidor

---

## 📲 PWA: instalação real e uso offline

⚠️ **Importante:** `manifest.json` e `service-worker.js` só funcionam quando o app é servido via `http://` ou `https://` — abrindo o arquivo direto (`file://`), como acima, o navegador ignora os dois e o app funciona só no modo "site comum" (sem cache offline e sem ícone/nome customizados na instalação).

Para ativar o PWA de verdade:

1. **Publique os arquivos** em qualquer hospedagem estática com HTTPS — ex.: [GitHub Pages](https://pages.github.com/), Netlify ou Vercel (basta subir a pasta do projeto, sem build).
2. **No iPhone (Safari):** abra a URL publicada → **Compartilhar** → **"Adicionar à Tela de Início"**. Agora o app abre em tela cheia, com o ícone gerado (`icons/`), e continua funcionando **offline** depois do primeiro acesso.
3. **No Android/Desktop (Chrome/Edge):** o navegador oferece o prompt "Instalar app" automaticamente.

Para testar localmente antes de publicar, sirva a pasta com qualquer servidor estático (não abra via `file://`) — por exemplo `npx serve .` (se tiver Node) ou a extensão "Live Server" do VS Code — e acesse `http://localhost:<porta>`.

---

## 🛠️ O Que Evoluir no Claude Code

Estas são as melhorias sugeridas para implementar com o Claude Code:

### 🔴 Prioridade Alta
- [x] **PWA (Progressive Web App)** — `manifest.json` + `service-worker.js` para instalação real no iPhone e funcionamento offline
- [ ] **Backend com Node.js + Express** — API REST para salvar dados em servidor
- [ ] **Banco de dados** — SQLite (simples) ou PostgreSQL (produção)
- [ ] **Autenticação** — Login por usuário/senha, com perfis (médico, enfermeiro, admin)
- [ ] **Sincronização entre dispositivos** — dados na nuvem, acessíveis de qualquer celular

### 🟡 Prioridade Média
- [ ] **Edição de paciente** — atualmente só cadastra e exclui; precisa de tela de edição
- [ ] **Alta do paciente** — mover para histórico ao dar alta, liberar o leito
- [ ] **Notificações push** — alertar sobre pendências, ATB longa, alta prevista
- [ ] **Relatórios** — exportar lista de pacientes em PDF ou Excel
- [ ] **Histórico de ATB** — registrar todos os antibióticos usados, não só os ativos
- [ ] **Escalonamento de antimicrobianos** — integrar protocolo CCIH

### 🟢 Melhorias de Interface
- [ ] **Modo claro** — alternativa ao tema escuro atual
- [ ] **Filtro por data de internação**
- [ ] **Ordenação customizável** — por dias de internação, ala, nome
- [ ] **Foto/prontuário do paciente** (opcional)
- [ ] **Linha do tempo de evolução** — registro diário por paciente

---

## 🗃️ Estrutura de Dados (atual)

Cada paciente tem o seguinte formato em JSON:

```json
{
  "id": 1720000000000,
  "bed": "L-01",
  "name": "Nome Completo do Paciente",
  "age": 67,
  "ward": "UTI",
  "admitDate": "2025-07-02",
  "altaDate": "2025-07-17",
  "pathologies": ["Sepse pulmonar", "HAS", "DM2"],
  "medications": [
    "Noradrenalina 0,1mcg/kg/min IV",
    "Omeprazol 40mg 1x/dia"
  ],
  "antibiotics": [
    { "name": "Meropenem 2g 8/8h IV", "startDate": "2025-07-09" }
  ],
  "pendings": [
    "Resultado hemoculturas (48h)",
    "Fisioterapia respiratória"
  ],
  "transfer": false,
  "fastmedic": "",
  "destino": ""
}
```

---

## 🏗️ Arquitetura Sugerida para o Backend

```
medcontrol/
├── frontend/
│   ├── index.html          ← app principal (já em formato PWA)
│   ├── manifest.json       ← PWA (já implementado)
│   └── service-worker.js   ← cache offline (já implementado)
├── backend/
│   ├── server.js           ← Express.js
│   ├── routes/
│   │   ├── patients.js     ← CRUD de pacientes
│   │   └── auth.js         ← autenticação
│   ├── models/
│   │   └── Patient.js      ← modelo de dados
│   └── db/
│       └── database.sqlite ← banco de dados
├── package.json
└── README.md
```

---

## 💡 Prompt Sugerido para o Claude Code

Cole isso ao abrir o projeto no Claude Code:

```
Tenho um sistema hospitalar chamado MedControl (arquivo medcontrol-mobile.html).
Quero evoluí-lo para uma aplicação completa com:
1. Backend em Node.js + Express
2. Banco de dados SQLite para persistir os dados
3. API REST com rotas para pacientes (GET, POST, PUT, DELETE)
4. Autenticação simples por usuário e senha
5. PWA com manifest.json e service-worker para funcionar offline no iPhone

Comece pela estrutura de pastas e o backend. O frontend atual já está pronto
e só precisa ser adaptado para consumir a API ao invés do localStorage.
```

---

## 📞 Contexto do Projeto

- **Hospital:** 100 leitos
- **Alas:** UTI, Clínica Médica, Cirurgia, Pediatria, Obs/Maternidade
- **Uso principal:** iPhone (Safari), acesso pela equipe médica e de enfermagem
- **Sistema de transferência:** FastMedic (protocolo da Central de Leitos)
- **Desenvolvido em:** Claude (claude.ai) — julho de 2025

---

*Projeto gerado com ✚ Claude — pronto para escalar no Claude Code.*
