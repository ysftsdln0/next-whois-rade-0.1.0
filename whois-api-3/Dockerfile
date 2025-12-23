FROM node:18-alpine

# Install whois
RUN apk add --no-cache whois

WORKDIR /app

COPY package.json ./
COPY server.js ./

ENV PORT=4003
ENV API_NAME=WHOIS-API-3

EXPOSE 4003

CMD ["node", "server.js"]
