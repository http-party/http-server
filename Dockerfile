FROM node


WORKDIR /app
COPY . /app
RUN npm i
EXPOSE 8080

VOLUME [ "/data" ]

CMD node ./bin/http-server -v -p 8080 
