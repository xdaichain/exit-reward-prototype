FROM node:8-slim

EXPOSE 80

WORKDIR /app
COPY components ./components
COPY pages ./pages
COPY next.config.js package.json server.js ./
RUN mkdir data && npm install && npm run build

CMD npm run start