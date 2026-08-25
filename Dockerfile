FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci --omit=dev
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
CMD ["node", "packages/platform/src/server.js"]
