FROM node:19.0.0-buster-slim

ADD . /srv/http-server
WORKDIR /srv/http-server

RUN npm i
CMD ["bin/http-server"]
