# Mini CRM Neo-Brutalista 🚀

> [!IMPORTANT]
> **Assista à demonstração em vídeo:** [Link do projeto no Google Drive](https://drive.google.com/file/d/1LuRrtV-npRczYvbUBOFPZ3euOYd0I-Xq/view?usp=sharing)

Este repositório comporta a submissão para o desafio de construção de um CRM Inteligente e escalável, fundindo capacidades clássicas de vendas B2B com a nova onda de integrações via Inteligência Artificial numa arquitetura robusta Serverless. A aplicação foge do tradicional padrão corporativo visual aborrecido, apostando fortemente na estética **Neo-Brutalista** de alta performance e legibilidade agressiva.

## 📌 Descrição do Projeto
Trata-se de um sistema SaaS desenhado para times de vendas operarem contas distintas isoladas, permitindo gerenciamento avançado em estilo Kanban. Em seu núcleo, ele possui validação dinâmica restrita de regras de negócio (etapas criadas e protegidas via banco de dados), uma máquina de geração de campanhas contextuais e um mensageiro motorizado por IA (LLM via Edge Functions) capaz de avaliar as notas do lead e disparar propostas impecáveis e rastreáveis na timeline de vendas.

## 🛠️ Tecnologias Utilizadas

**Frontend & Arquitetura Visual:**
- **Next.js (App Router)** & **React**: SSR (Server-Side Rendering) e Server Actions.
- **TailwindCSS**: Utilitários com foco massivo em personalização visual pura (Custom blocks shadow, bordas marcadas).
- **Lucide React**: Iconografia padronizada.

**Backend, Infraestrutura & Banco de Dados:**
- **Supabase (PostgreSQL)**: Core Database com tabelas relacionais de multi-tenant e RBAC genérico.
- **Supabase Auth**: Autenticação nativa protegida por Edge.
- **Supabase Edge Functions (Deno)**: Ambiente serverless efêmero para blindar contatos com a API da IA.
- **APIs de LLM**: Motor gerador de copys em background via requisição segura de nuvem.

## 💡 Decisões Técnicas Principais

### 1. Estrutura do Banco de Dados Dinâmica
Ao invés de arquitetar o banco de dados com "colunas do Kanban" coladas no código fonte (*hardcoded variables*), optou-se por isolar a entidade `funnel_stages` de forma unificada no banco em conjunto com tabelas `lead_activity_logs` (Audit Trails). Modificações no Painel de Admin alteram na raiz quais colunas exigem dados arbitrários (JSON `required_fields`). Assim que o vendedor arrasta o mouse no Kanban (Drop), o frontend puxa a política do servidor para checar a validade da ação, cravando integridade sólida da operação comercial.

### 2. Arquitetura da Integração com LLM (Edge)
Invocamos IA de modo 100% isolado do front-end por premissas de segurança e CORS. A solicitação de geração viaja pela Context API em fila para uma *Edge Function Deno*. Esta função engole contexto da Campanha selecionada, acessa as chaves privadas (`SUPABASE_SECRETS`), requisita a API LLM e devolve a resposta diretamente ao banco de dados em cache (`generated_messages`). Assim asseguramos que recarregamentos rápidos da página não causem refetch, que mensagens fiquem no histórico do cliente eternamente e que se contabilize o "Hit Rate" do robô no Dashboard.

### 3. Implementação do Multi-Tenancy (Isolamento de Workspaces)
Nossa abordagem unifica flexibilidade e segurança em um cenário *many-to-many*. Construímos um relacional Pivô via IDs, constando de uma tabela `workspaces` e de `user_workspaces`. No Frontend do Next.js, em vez do cliente gerenciar pesados estados globais ou arriscadamente esquecer filtros na URL, injetamos **Server-Side Cookies Customizados**. Nisto, no ciclo de requisição via middlewares e Server Actions nativas, todos os metadados são enclausurados pelo `.eq('workspace_id', activeCookie)`, garantindo trânsito isolado perfeito entre organizações.

### 4. Desafios Encontrados e Como a Crise foi Resolvida
O "Gargalo Mor" do nosso desenvolvimento rodou em torno de três fatores centrais contemporâneos que se somaram para escalar a dificuldade:
* **Instabilidade da API Escolhida**: Durante iterações ao vivo para a Edge Function, retornos incompletos e rate limits rápidos da API da LLM atrapalhavam os blocos de teste.
* **Defasagem no Vibe Coding e Documentações Atrasadas**: A utilização do maquinário assíncrono em bleeding-edge (particularmente na leitura das interfaces `await cookies()` adotadas no React 19/Next 15) esbarrou com o conhecimento preestabelecido de *AI-Code Generation Tools* que tentavam compilar lógicas em padrões antiquados.
* **Anomalias de Caching e RLS Transacional (PostgREST + Next.js)**: Enfrentamos falsos-negativos drásticos durante o escalonamento para o algoritmo de Multi-Tenancy. O PostgREST (motor do Supabase) em conjunto com o Cache agressivo nativo do React Server Components criava "corridas de condição" (Race Conditions). Consultas aninhadas em junções de tabelas (JOINs) bloqueavam nomes de empresas via políticas RLS latentes, enquanto componentes de UI não desmontavam sua memória (`useState`), causando vazamento visual transitório de dados de clientes anteriores na Interface até ocorrer force-refresh do DOM.
**A Solução Geral**: Fomos forçados a transições pesadas: debugamos logs brutos via servidor, contornamos alucinações atrelando tipagens estritas sem depender dos scripts autônomos da LLM e isolamos consultas instáveis de junção (JOINs) extraindo-as para funções de RPC (Remote Procedure Call) de via-única nativas dentro do PostgreSQL, finalizando com o uso de chaves forçadas (`key={id}`) obrigando a destruição limpa do layout Client-Side no React a cada troca de Organização.

## ✅ Funcionalidades Implementadas (Checklist de Entregas)

Aqui estão as funcionalidades core levantadas desde os requisitos iniciais às injeções avançadas exclusivas deste pacote:
* [x] **Autenticação Padrão e Painel Dinâmico**: Permissões de Login conectadas ao banco em real-time.
* [x] **Kanban Inteligente (DnD)**: Visualização em quadros fluídos drag and drop, transições e busca/filtragem com baixa latência pelo cliente.
* [x] **Gestão de Estágios de Pipeline Editáveis**: Telas de setup para plugar travas de validação em campos (não avança se o campo exigido na UI X estiver vazio).
* [x] **Automação de Respostas e Copywright via IA**: Integração com servidor backend isolado gerando textos românticos, casuais ou urgentes casados às necessidades explícitas da "Campanha" setada em tela pelos gestores e aos dados captados da empresa atual (cargo, nome, etc).
* [x] **Trilha de Auditoria Visual (Activity Logs)**: Time-line mostrando todas as mexidas, atualizações no form, envios de convites e confirmação física de IA enviada por aquele lead.
* [x] **Sistema Nativo Multi-tenant Switcher**: Gestão de empresas e organizações múltiplas atreladas à logica de Cookie sem precisar de subdomínios.
* [x] **Portal Automático e Físico de Convites Seguros**: Formulários que fabricam links reais consumíveis únicos `localhost:3000/invite/[token]` com autorização acoplada a sessão.
* [x] **Dashboard de Analytics em CSS Puro SSR**: Dashboard agregando Gargalos de Pipeline em barras animadas ativas em CSS nativo (fugindo de bibliotecas gigantes de Javascript), somando Hit-Rate de adoção da Robô Inteligente de Vendas vs Engajamento geral.
