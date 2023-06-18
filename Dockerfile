FROM gplane/pnpm:8.2.0-node18
WORKDIR /usr/src/app
COPY *.json ./
COPY *.yaml ./
RUN pnpm install
RUN pnpm run build
COPY . ./
CMD [ "node", "dist/app.js" ]