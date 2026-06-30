FROM node:20-alpine

# Install openssl and libc compatibility libraries for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client directly inside the container system to match the exact system library engine
RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["node", "dist/server.js"]
