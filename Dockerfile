FROM node:18-alpine
VOLUME /public
WORKDIR /srv/http-server
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
USER node
WORKDIR /public
ENTRYPOINT ["node", "/srv/http-server/bin/http-server"]
