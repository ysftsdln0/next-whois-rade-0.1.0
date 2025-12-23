FROM node:18-alpine

# Install whois
RUN apk add --no-cache whois

WORKDIR /app

COPY package.json ./
COPY server.js ./

ENV PORT=4002
ENV API_NAME=WHOIS-API-2

EXPOSE 4002

CMD ["node", "server.js"]
