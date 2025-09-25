FROM node:20-alpine

WORKDIR /usr/src/app

# Necesario si bcrypt no trae binario precompilado en Alpine
RUN apk add --no-cache python3 make g++ curl

# Instala deps (incluye devDependencies para Nest CLI)
COPY package*.json ./
ENV NODE_ENV=development
RUN npm ci

# Copia código
COPY . .

EXPOSE 3000

# Deja que Compose use este CMD
CMD ["npm", "run", "start:dev"]
