# **Fase 1: A Fundação – O Esqueleto do Sistema**

**Objetivo:** Ter a infraestrutura básica rodando e um primeiro fluxo mínimo funcionando: requisitar um upload e registrar o arquivo no banco.

| # | O que fazer (Ação)                               | Onde (Localização)                                                      | Por quê? (Justificativa)                                                                                         |
| - | ------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1 | Configurar o Docker Compose                      | `docker-compose.yml` (na raiz do projeto)                               | Criar e orquestrar os contêineres da infraestrutura (PostgreSQL, Redis, MinIO, RabbitMQ) de forma reprodutível.  |
| 2 | Implementar o PrismaService                      | `libs/common/src/prisma/` (criar uma nova lib ou usar uma lib "common") | Centralizar a lógica de conexão com o banco. Os outros serviços apenas injetam este módulo, evitando duplicação. |
| 3 | Aplicar a Migração Inicial do Banco              | Terminal (na raiz do projeto)                                           | Criar as tabelas `files` e `processing_logs` no PostgreSQL a partir do `schema.prisma`.                          |
| 4 | Configurar o Upload Service                      | `apps/upload-service/`                                                  | Preparar o primeiro ponto de entrada do sistema.                                                                 |
| 5 | Implementar a Lógica de Geração de Presigned URL | `apps/upload-service/` (em um novo `StorageService`)                    | Criar o endpoint que gera uma URL segura de upload via MinIO.                                                    |
| 6 | Criar o Endpoint de Upload                       | `apps/upload-service/src/upload-service.controller.ts`                  | Expor a funcionalidade de gerar URL de upload via REST (POST `/uploads`).                                        |
| 7 | Publicar o Evento `file.uploaded`                | `apps/upload-service/`                                                  | Iniciar a comunicação assíncrona avisando que um novo arquivo está a caminho.                                    |

**Checkpoint da Fase 1:**
- [ ] Deve ser possível iniciar tudo com `docker-compose up`, fazer uma requisição para a API, receber uma URL de upload e ver um novo registro com status **PENDING** na tabela `files`.

---

# **Fase 2: O Coração – Processamento Assíncrono**

**Objetivo:** Fazer com que o *Processing Service* consuma o evento, processe o arquivo e atualize seu status.

| # | O que fazer (Ação)                          | Onde (Localização)                                             | Por quê? (Justificativa)                                                            |
| - | ------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1 | Configurar o Processing Service como Worker | `apps/processing-service/src/main.ts`                          | Permitir que o serviço se conecte ao RabbitMQ como ouvinte da fila `file.uploaded`. |
| 2 | Implementar o Consumidor de Eventos         | `apps/processing-service/src/processing-service.controller.ts` | Criar o método com `@EventPattern('file.uploaded')` para consumir mensagens.        |
| 3 | Implementar a Lógica de Processamento       | `apps/processing-service/src/processing-service.service.ts`    | Baixar o arquivo do MinIO, calcular hash (SHA-256) e extrair tamanho.               |
| 4 | Adicionar Lock Distribuído com redlock      | Mesmo arquivo acima                                            | Prevenir processamento duplicado adquirindo lock via Redis usando o ID do arquivo.  |
| 5 | Atualizar o Status no Banco                 | `apps/processing-service/` (usando PrismaService)              | Persistir PROCESSED e salvar metadados.                                             |
| 6 | Publicar Evento `file.processed`            | `apps/processing-service/`                                     | Informar a conclusão do processamento para outros serviços.                         |
| 7 | Implementar Retries e DLQ                   | Configuração do RabbitMQ                                       | Aumentar a resiliência e evitar perda de mensagens.                                 |

**Checkpoint da Fase 2:**
- [ ] Após o fluxo da Fase 1, o Processing Service deve processar o arquivo, atualizar seu status para **PROCESSED** e salvar os metadados extraídos.

---

# **Fase 3: A Fachada – Exposição e Notificação**

**Objetivo:** Permitir consulta ao estado dos arquivos e notificar sistemas externos em tempo real.

| # | O que fazer (Ação)                | Onde (Localização)                                                 | Por quê? (Justificativa)                                             |
| - | --------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1 | Criar a Metadata API              | `apps/metadata-api/`                                               | Expor dados do banco de forma segura e otimizada.                    |
| 2 | Implementar Endpoints de Consulta | `apps/metadata-api/src/metadata-api.controller.ts`                 | Criar endpoints GET `/files` e `/files/:id` com filtros e paginação. |
| 3 | Adicionar Cache com Redis         | `apps/metadata-api/`                                               | Acelerar respostas e diminuir carga no banco.                        |
| 4 | Configurar o Notification Service | `apps/notification-service/`                                       | Preparar o serviço para reagir a eventos.                            |
| 5 | Consumir Evento `file.processed`  | `apps/notification-service/src/notification-service.controller.ts` | Disparar notificações pós-processamento.                             |
| 6 | Configurar Gateway WebSocket      | `apps/notification-service/src/notification.gateway.ts`            | Enviar atualizações em tempo real para o frontend.                   |

**Checkpoint da Fase 3:**
- [ ] pode consultar arquivos via API e clientes WebSocket recebem uma notificação quando um arquivo é processado.

---

# **Fase 4: O Polimento – Observabilidade e Operações**

**Objetivo:** Tornar o sistema observável, depurável e pronto para produção. É o maior diferencial do projeto.

| # | Ação                               | Onde                                | Por quê?                                        |
| - | ---------------------------------- | ----------------------------------- | ----------------------------------------------- |
| 1 | Adicionar Logs Estruturados (JSON) | Todos os serviços                   | Facilita coleta e busca em Loki/Elastic.        |
| 2 | Instrumentar com OpenTelemetry     | Todos os serviços                   | Criar traces distribuídos (Jaeger).             |
| 3 | Habilitar Tracing no Prisma        | `prisma/schema.prisma`              | Incluir queries nos traces.                     |
| 4 | Expor Métricas com Prometheus      | `apps/processing-service/` e outros | Coletar métricas vitais de negócio/performance. |
| 5 | Criar Dashboards no Grafana        | Configuração ou UI                  | Visualizar comportamento e saúde do sistema.    |
| 6 | Dockerizar Apps NestJS             | `apps/*/Dockerfile`                 | Preparar para orquestração em Kubernetes.       |
| 7 | Criar Manifestos Kubernetes        | `k8s/` ou `infra/`                  | Definir deploy, services, ingress, HPA.         |
| 8 | Construir Pipeline CI/CD           | `.github/workflows/ci.yml`          | Automatizar build, teste e deploy.              |
