FROM ghcr.io/puppeteer/puppeteer:19.7.2

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
    MONGODB_URI = mongodb+srv://aviraljainltr:O0mG7JLWltmxrZMQ@cluster0.en2iw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "api/server.js" ]