FROM node:10.13-alpine as BUILD
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --silent --progress=false
COPY . .
RUN npm run build

FROM node:10.13-alpine as PROD
WORKDIR /usr/src/app
COPY --from=BUILD /usr/src/app/package*.json ./ 
RUN npm install --silent --progress=false --production
COPY --from=BUILD /usr/src/app/dist/ ./dist/
COPY --from=BUILD /usr/src/app/openapi.yaml ./

RUN mkdir logs
EXPOSE 3000
CMD ["npm", "run", "serve"]
