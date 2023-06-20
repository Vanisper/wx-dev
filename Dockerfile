FROM alpine:3.18
RUN apk add ca-certificates
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
# RUN npm install pnpm -g
RUN npm -v

WORKDIR /app
COPY *.json /app
COPY *.yaml /app
RUN npm install
COPY . /app
RUN npm run build
COPY . /app
CMD [ "node", "dist/app.js" ]
# FROM gplane/pnpm:8.2.0-node18
# WORKDIR /usr/src/app
# COPY *.json ./
# COPY *.yaml ./
# RUN pnpm install
# COPY . ./
# RUN pnpm run build
# COPY . ./
# CMD [ "node", "dist/app.js" ]