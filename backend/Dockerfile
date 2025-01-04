# Verwende ein Node.js-Base-Image
FROM node:18

# Arbeitsverzeichnis erstellen und setzen
WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# Anwendungscode kopieren
COPY . .

# Port 8080 für Docker öffnen
EXPOSE 8080

# Anwendung starten
CMD ["node", "backend_file.js"]