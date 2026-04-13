FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Production build
RUN npm run build

# ── Serve with nginx ─────────────────────────────────────────
FROM nginx:alpine

# Build output copy করো
COPY --from=builder /app/dist /usr/share/nginx/html

# React Router এর জন্য nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]