// firebase-messaging-sw.js
// Wajib ada persis di root situs (sejajar dengan index.html), namanya harus persis ini.
// File ini yang menampilkan notifikasi saat aplikasi TERTUTUP atau HP terkunci.

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

// skipWaiting + clients.claim(): begitu ada versi service worker baru ter-deploy,
// LANGSUNG aktif dan ambil alih kontrol tanpa perlu semua tab ditutup dulu.
// Ini mencegah HP "nyangkut" pakai versi service worker lama yang mungkin ada bug.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

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
