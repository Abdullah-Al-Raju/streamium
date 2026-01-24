FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 5173

ENV NODE_ENV=production

CMD ["node", "build"]
