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

// Saat pesan FCM masuk ketika app/tab TIDAK sedang dibuka aktif,
// browser otomatis memanggil ini dan menampilkan notifikasi sistem.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || '📦 Pesanan Baru Masuk!';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: undefined,
    tag: (payload.data && payload.data.orderId) ? 'cashgo-order-' + payload.data.orderId : 'cashgo-order',
    vibrate: [200, 80, 200]
  };
  self.registration.showNotification(title, options);
});

// Klik notifikasi -> buka/fokuskan tab aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
