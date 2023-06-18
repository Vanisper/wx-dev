FROM node:18.16.0
WORKDIR /usr/src/app
COPY package*.json ./
COPY *.yaml ./
RUN npm install pnpm -g
COPY . ./
CMD [ "node", "dist/app.js" ]
