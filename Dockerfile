FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN apt-get update && apt-get install -y ffmpeg

COPY . .

EXPOSE 80

CMD ["node", "main.js"]