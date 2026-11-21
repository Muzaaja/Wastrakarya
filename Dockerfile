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
    && apt-get clean && rm -rf /var/lib/apt/lists/*
    && git lfs install

# Install ekstensi PHP untuk Laravel, MySQL, dan Reverb
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

ARG GITHUB_TOKEN
ARG REPO_URL

RUN CLEAN_URL=${REPO_URL#https://} && \
    git init && \
    git remote add origin https://${GITHUB_TOKEN}@${CLEAN_URL} && \
    git fetch origin main --depth=1 && \
    git reset --hard origin/main && \
    git lfs pull && \
    rm -rf .git

ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-interaction
RUN npm ci && npm run build

EXPOSE 8080

CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8080}