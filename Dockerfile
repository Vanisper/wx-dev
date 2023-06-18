FROM node:lts-slim
WORKDIR /usr/src/app
COPY package*.json ./
COPY *.yaml ./
RUN npm install pnpm -g
RUN pnpm install
RUN pnpm run build
COPY . ./
CMD [ "node", "dist/app.js" ]
