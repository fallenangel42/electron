FROM node:current-alpine
ENV NODE_ENV production

WORKDIR /app

COPY package.json /app
COPY package-lock.json /app
RUN npm ci --only=production && npm cache clean --force
COPY . /app

EXPOSE 5000

CMD node index.js
