FROM node:20-alpine

WORKDIR /app

# Dependencies আগে copy করো (cache layer)
COPY package*.json ./
RUN npm install --production

# Source copy করো
COPY . .

# Uploads folder তৈরি করো
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "src/server.js"]