/* =====================================================================
   PELACAK JAM BELAJAR EDUKINETIKA
   Mencatat lama belajar siswa per hari ke Firebase:
     belajarHarian/{uid}/{YYYY-MM-DD}: jumlah detik
   Waktu hanya dihitung saat halaman terbuka di layar DAN siswa aktif
   (ada gerakan mouse/sentuhan/ketikan/scroll dalam 3 menit terakhir).

   Pasang di halaman mana pun yang ingin dihitung jam belajarnya
   (dashboard, materi, lab, LKPD, kuis) dengan satu baris sebelum </body>:
     <script type="module" src="pelacak-belajar.js"></script>
   ===================================================================== */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyA_YUPPq0CZgNi5McaTx3-a8LOGW70zIzg",
    authDomain: "starararrara.firebaseapp.com",
    databaseURL: "https://starararrara-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "starararrara",
    storageBucket: "starararrara.firebasestorage.app",
    messagingSenderId: "1085300087665",
    appId: "1:1085300087665:web:375eae85042f14ffa7f4d0"
};
const LANGKAH = 30;            // detik per pencatatan
const BATAS_DIAM = 3 * 60000;  // dianggap tidak aktif setelah 3 menit tanpa interaksi

if (!window.__ekPelacak) {
    window.__ekPelacak = true;
    (async () => {
        try {
            const V = '10.12.2';
            const APP = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
            const A = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);
            const D = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-database.js`);
            const app = APP.getApps().length ? APP.getApp() : APP.initializeApp(FIREBASE_CONFIG);
            const db = D.getDatabase(app);

            let terakhirAktif = Date.now();
            ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(ev =>
                addEventListener(ev, () => { terakhirAktif = Date.now(); }, { passive: true }));

            const hariIni = () => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            };

            let timer = null;
            A.onAuthStateChanged(A.getAuth(app), (user) => {
                clearInterval(timer);
                if (!user) return;
                const uid = user.uid;
                const tandaiOnline = (on) => D.update(D.ref(db, `siswa/${uid}`), { online: on, lastActive: Date.now() }).catch(() => { });
                tandaiOnline(true);
                timer = setInterval(() => {
                    const aktif = document.visibilityState === 'visible' && Date.now() - terakhirAktif < BATAS_DIAM;
                    if (!aktif) return;
                    D.update(D.ref(db, `belajarHarian/${uid}`), { [hariIni()]: D.increment(LANGKAH) }).catch(() => { });
                    tandaiOnline(true);
                    window.dispatchEvent(new CustomEvent('ek-belajar', { detail: { detik: LANGKAH } }));
                }, LANGKAH * 1000);
                addEventListener('pagehide', () => tandaiOnline(false));
            });
        } catch (e) { console.warn('Pelacak jam belajar tidak aktif:', e); }
    })();
}