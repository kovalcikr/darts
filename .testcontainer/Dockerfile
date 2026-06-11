FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    CI=true

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN npm install --no-save --no-audit --no-fund @playwright/test@1.59.1

RUN npx playwright install --with-deps chromium

COPY .testcontainer/bin/test.sh /usr/local/bin/test
RUN chmod +x /usr/local/bin/test

ENTRYPOINT ["/usr/local/bin/test"]
CMD ["all"]
