FROM node:14-alpine
RUN mkdir -p /code/src
COPY ./package-lock.json /code
COPY ./package.json /code
COPY ./tsconfig.json /code
COPY ./src /code/src
WORKDIR /code/src
RUN npm install && npm run build
ENTRYPOINT [ "node", "/code/dist/sb.js"]