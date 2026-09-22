FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
USER node
EXPOSE 5000
HEALTHCHECK CMD wget -qO- http://localhost:5000/healthz || exit 1
CMD ["node", "src/server.js"]
