# WastraKanvas

## Cara Menjalankan

1. Install semua library yang dibutuhkan
```
composer install
npm install --legacy-peer-deps
php artisan install:broadcasting --reverb
```

2. Setup
```
php artisan key:generate
php artisan migrate:fresh --seed
```

3. Jalankan
```
php artisan serve
php artisan reverb:start
npm run dev
```

## Akun Default

> Jalankan `php artisan migrate:fresh --seed` dahulu.

### Admin

Email: `admin@example.com`

Password: `password`

Admin akan diarahkan ke `/admin/dashboard` setelah masuk. Dari halaman tersebut,
admin dapat mencari pelanggan serta mengaktifkan, menonaktifkan, dan mengatur
tanggal berakhir langganan.

### Admin

Email: `admin@example.com`

Password: `password`

### Premium

Email: `premium@example.com`

Password: `password`

### Non-Premium

Email: `nonpremium@example.com`

Password: `password`
