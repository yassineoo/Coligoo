FROM node:18-alpine AS node

WORKDIR /app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD [ "npm", "run", "start:dev", "npm", "run", "seed" ]