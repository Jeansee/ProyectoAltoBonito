# backend/Dockerfile
FROM node:20

WORKDIR /usr/src/app

# Instala solo deps primero (usa cache de Docker)
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copia el resto del código
COPY . .

# Genera Prisma client una sola vez
RUN npx prisma generate

# Si usas Nest + TS dev:
# CMD ["npm","run","start:dev"]
# Si quieres arranque rápido y estable en dev: usa build + node dist
# RUN npm run build
# CMD ["node","dist/src/main.js"]

# Para dev “rápido”: deja start:dev, pero ya sin npm install
CMD ["npm","run","start:dev"]
