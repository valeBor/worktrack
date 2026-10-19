# syntax=docker/dockerfile:1

# =====================================================
# DEPENDENCIAS NODE.JS DE PRODUCCION
# =====================================================

FROM node:22-alpine AS dependencies

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./

RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && npm cache clean --force


# =====================================================
# FLYWAY
# Misma version utilizada localmente.
# =====================================================

FROM flyway/flyway:13.3.0-alpine AS flyway


# =====================================================
# IMAGEN FINAL DEL BACKEND
# =====================================================

FROM node:22-alpine AS runtime

RUN apk add --no-cache \
    bash \
    icu-libs \
    krb5-libs \
    libgcc \
    libintl \
    libssl3 \
    libstdc++ \
    zlib

ENV NODE_ENV=production

ENV JAVA_HOME=/opt/java/openjdk
ENV PATH="/flyway:/opt/java/openjdk/bin:${PATH}"

ENV FLYWAY_LOCATIONS=filesystem:/app/database/migrations
ENV FLYWAY_CLEAN_DISABLED=true
ENV FLYWAY_VALIDATE_MIGRATION_NAMING=true

WORKDIR /app

# Copia Java y Flyway desde la imagen oficial.
COPY --from=flyway /opt/java/openjdk /opt/java/openjdk
COPY --from=flyway /flyway /flyway

# Copia solamente dependencias necesarias en produccion.
COPY --chown=node:node --from=dependencies \
    /app/backend/node_modules \
    ./backend/node_modules

# Copia el backend y las migraciones.
COPY --chown=node:node backend ./backend
COPY --chown=node:node database/migrations ./database/migrations

USER node

EXPOSE 3000

CMD ["node", "backend/server.js"]