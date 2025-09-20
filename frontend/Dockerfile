# Etapa de desarrollo
FROM node:18-alpine

WORKDIR /usr/src/app

# Archivos de configuración
COPY package*.json ./

# Instalación de dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 5173

# Comando para desarrollo
CMD ["npm", "run", "dev", "--", "--host"]