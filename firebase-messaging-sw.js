// firebase-messaging-sw.js
// Wajib ada persis di root situs (sejajar dengan index.html), namanya harus persis ini.
// File ini menangani DUA hal: (1) push notification saat app tertutup/HP terkunci,
// (2) cache app-shell supaya app tetap bisa dibuka walau internet mati total.

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// PENTING: config ini HARUS SAMA PERSIS dengan firebaseConfig di index.html.
// Service worker berjalan terpisah dari halaman utama, jadi tidak bisa "pinjam"
// variabel dari index.html — config-nya harus ditulis ulang di sini.
firebase.initializeApp({
  apiKey: "AIzaSyDhASZq7FoOz-jTpMLyl2ct5DG3IdC-JZo",
  authDomain: "cashgo-74e37.firebaseapp.com",
  projectId: "cashgo-74e37",
  storageBucket: "cashgo-74e37.firebasestorage.app",
  messagingSenderId: "750484180681",
  appId: "1:750484180681:web:9085b76b3fa13308074718"
});

const messaging = firebase.messaging();

// ================= Cache app-shell untuk offline =================
// Naikkan angka versi ini (v2, v3, dst) tiap kali index.html berubah signifikan,
// supaya cache lama dibuang dan tidak ada yang "nyangkut" pakai versi basi.
const CACHE_NAME = 'cashgo-shell-v1';
const PRECACHE_URLS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
    ])
  );
});

// Strategi "network-first, fallback ke cache": selalu coba ambil versi terbaru
// dari internet dulu (karena app ini sering berubah), TAPI kalau gagal/offline,
// langsung pakai salinan terakhir yang tersimpan di HP — jadi app tetap bisa
// dibuka walau tidak ada sinyal sama sekali (meski datanya mungkin bukan yang
// paling baru sampai koneksi kembali).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return; // biarkan Firestore SDK urus sendiri
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});

// ================= Push notification =================
// Saat pesan FCM masuk ketika app/tab TIDAK sedang dibuka aktif,
// browser otomatis memanggil ini dan menampilkan notifikasi sistem.
// PENTING: kita HANYA baca dari payload.data (bukan payload.notification).
// Cloud Function sengaja mengirim data-only supaya notifikasi CUMA muncul
// dari sini satu kali — kalau ada payload.notification juga, browser akan
// menampilkan notifikasi otomatis SENDIRI di luar kendali kita, jadinya dobel.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const isChat = d.type === 'chat';
  const title = d.title || '📦 Pesanan Baru Masuk!';
  const options = {
    body: d.body || '',
    tag: d.orderId ? 'cashgo-order-' + d.orderId : 'cashgo-order',
    renotify: true,
    requireInteraction: !isChat, // pesanan baru harus disadari, chat cukup notifikasi biasa
    vibrate: isChat ? [120] : [250, 100, 250, 100, 250],
    data: { link: (payload.fcmOptions && payload.fcmOptions.link) || './' }
  };
  self.registration.showNotification(title, options);
});

// Klik notifikasi -> buka/fokuskan tab aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.link) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
