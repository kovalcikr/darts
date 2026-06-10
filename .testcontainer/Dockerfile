FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:4-22-bookworm

ENV DEBIAN_FRONTEND=noninteractive \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    CI=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

RUN npx playwright install --with-deps chromium

COPY .testcontainer/bin/test.sh /usr/local/bin/test
RUN chmod +x /usr/local/bin/test

ENTRYPOINT ["/usr/local/bin/test"]
CMD ["all"]
