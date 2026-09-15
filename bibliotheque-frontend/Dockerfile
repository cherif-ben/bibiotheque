# =============================================================================
# Bibliothèque — Frontend Next.js (port 3000)
# =============================================================================

# ---- Étape 1 : build --------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# L'URL de l'API est lue à l'étape de build (NEXT_PUBLIC_*).
# docker-compose la fournit via build.args ; par défaut : localhost:8080.
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---- Étape 2 : exécution ----------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
