FROM node:18-alpine

# Install whois
RUN apk add --no-cache whois

WORKDIR /app

COPY package.json ./
COPY server.js ./

ENV PORT=4001
ENV API_NAME=WHOIS-API-1

EXPOSE 4001

CMD ["node", "server.js"]
