# WastraKanvas

## Cara Menjalankan

1. Install semua library yang dibutuhkan
```
composer install
npm install
php artisan install:broadcasting --reverb
```

2. Setup
```
php artisan key:generate
php aritsan migrate:fresh --seed
```

3. Jalankan
```
php artisan serve
php artisan reverb:start
npm run dev
```

## Akun Default

> Jalankan  ```php aritsan migrate:fresh --seed``` dahulu

### Premium

Email: premium@example.com.
Password: password.

### Non-Premium

Email: nonpremium@example.com.
Password: password.