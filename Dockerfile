FROM php:8.4-cli

# Install dependensi sistem & Node.js 20
RUN apt-get update && apt-get install -y \
    git \
    git-lfs \
    ca-certificates \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && git lfs install

# Install ekstensi PHP untuk Laravel, MySQL, dan Reverb
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

# Variabel metadata bawaan Railway (aman menggunakan ARG karena bukan secret)
ARG RAILWAY_GIT_REPO_OWNER
ARG RAILWAY_GIT_REPO_NAME
ARG RAILWAY_GIT_BRANCH=main

# Mount GITHUB_TOKEN via BuildKit secret tanpa menyimpannya di image layer
RUN --mount=type=secret,id=GITHUB_TOKEN \
    if [ ! -s /run/secrets/GITHUB_TOKEN ]; then \
        echo "ERROR: GITHUB_TOKEN kosong! Pastikan sudah di-Save & Deploy di tab Variables."; \
        exit 1; \
    fi && \
    AUTH_HEADER=$(printf "x-access-token:%s" "$(cat /run/secrets/GITHUB_TOKEN)" | base64 -w 0) && \
    git init && \
    git remote add origin "https://github.com/${RAILWAY_GIT_REPO_OWNER}/${RAILWAY_GIT_REPO_NAME}.git" && \
    git -c http.extraheader="AUTHORIZATION: basic ${AUTH_HEADER}" fetch origin "${RAILWAY_GIT_BRANCH}" --depth=1 && \
    git reset --hard "origin/${RAILWAY_GIT_BRANCH}" && \
    git -c http.extraheader="AUTHORIZATION: basic ${AUTH_HEADER}" lfs pull && \
    rm -rf .git

ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm ci && npm run build

EXPOSE 8080

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8080}