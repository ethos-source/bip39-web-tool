FROM node:10-alpine

ARG UID=1000
ARG GID=1000

ENV UID=${UID}
ENV GID=${GID}

RUN apk add --no-cache git g++

ENV CODE_DIR /code
RUN mkdir -p $CODE_DIR && chown -R $UID:$GID $CODE_DIR

WORKDIR $CODE_DIR
USER $UID:$GID

COPY --chown=$UID:$GID "static/" ./static/
COPY --chown=$UID:$GID "favicon.ico" .
COPY --chown=$UID:$GID "index.html" .
COPY --chown=$UID:$GID "package.json" .
RUN npm install

CMD ["npm", "run", "convert"]