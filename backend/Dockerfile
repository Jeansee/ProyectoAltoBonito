# Etapa de desarrollo
FROM node:18-alpine

WORKDIR /usr/src/app

# Archivos de configuración
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

# Instalación de dependencias
RUN npm install

# Generar el cliente de Prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Comando para desarrollo
CMD ["npm", "run", "start:dev"]