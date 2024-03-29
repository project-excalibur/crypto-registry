
FROM node:16 AS app-base
WORKDIR /app
COPY ./api/package.json ./api/
COPY ./api/package-lock.json ./api/
COPY ./api/tsconfig.json ./api/
COPY ./api/tsconfig.build.json ./api/
COPY ./api/nest-cli.json ./api/
COPY ./api/jest*.js ./api/
COPY ./api/assets ./api/assets/
COPY ./api/.env.* ./api/
COPY ./api/.certs/*.crt ./api/.certs/
WORKDIR /app/api
RUN npm install

# Comment

COPY ./api/src ./src/
RUN npm run build
COPY ./api/src/mail-service/templates/ ./dist/mail-service/templates

WORKDIR /app
COPY ./client/*.json ./client/
COPY ./client/public ./client/public
COPY ./client/src ./client/src
WORKDIR /app/client
RUN npm install
RUN npm run build

WORKDIR /app
WORKDIR /app/api
EXPOSE 3000
CMD [ "node", "./dist/main.js" ]
