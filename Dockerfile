# --- Estágio 1: Builder ---
FROM node:20 AS builder

WORKDIR /usr/src/app

ARG APP_NAME

RUN if [ -z "$APP_NAME" ]; then echo "APP_NAME argument is not set" && exit 1; fi

COPY package.json yarn.lock ./

# Instala TODAS as dependências (incluindo devDependencies) para poder compilar o projeto.
RUN yarn install --frozen-lockfile

# Copia todo o resto do código-fonte.
COPY . .

# Gera o Prisma Client. Essencial para que o cliente esteja disponível no momento da compilação e execução.
RUN npx prisma generate

# Executa o build específico para a aplicação definida em APP_NAME.
# O Nx (ferramenta de monorepo do NestJS) é inteligente e só compilará o necessário.
RUN yarn build $APP_NAME


# --- Estágio 2: Production ---

FROM node:20-slim

WORKDIR /usr/src/app

ARG APP_NAME
ENV NODE_ENV=production

# Copia novamente os arquivos de dependência.
COPY package.json yarn.lock ./

# Instala APENAS as dependências de produção.
RUN yarn install --production --frozen-lockfile

# Copia os artefatos compilados do estágio 'builder'.

COPY --from=builder /usr/src/app/dist/apps/$APP_NAME ./dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]