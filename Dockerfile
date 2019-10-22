FROM node:10.13-alpine as BASE
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --silent --progress=false
COPY . .
RUN npm run build

FROM node:10.13-alpine as BUILD
WORKDIR /usr/src/app
COPY --from=BASE /usr/src/app/package*.json ./ 
RUN npm install --silent --progress=false --production
COPY --from=BASE /usr/src/app/dist/ ./dist/
COPY --from=BASE /usr/src/app/openapi.yaml ./

FROM node:10.13-alpine as PROD
WORKDIR /usr/src/app
COPY --from=BUILD /usr/src/app ./
RUN mkdir logs
EXPOSE 3000
CMD ["npm", "run", "serve"]
