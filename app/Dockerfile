FROM node:8-slim

WORKDIR /app
COPY components ./components
COPY pages ./pages
COPY next.config.js .
COPY package-lock.json .
COPY package.json .
COPY server.js .
RUN mkdir data && npm install

CMD npm run dev
