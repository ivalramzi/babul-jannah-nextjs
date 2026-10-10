// Data tetap situs. Jadwal, acara, dan artikel diatur lewat /admin (lihat src/content.json).
export const site = {
  nama: 'Babul Jannah',
  tagline: 'Ngaji bareng, hati jadi tenang.',
  wa: '6281234567890', // format internasional tanpa +
  email: 'babuljannah25@gmail.com',
  alamat: 'Jalan Karang Anyar No. 285, RT.6/RW.8, Kelurahan Cigugur Tengah, Cimahi Tengah, Kota Cimahi, Jawa Barat',
  instagramUser: 'potret.babuljannah',
  instagram: 'https://www.instagram.com/potret.babuljannah/',
  youtube: 'https://www.youtube.com/@babul_jannahtv',
}
// Profil (ubah angka pengikut & mengikuti di sini). Jumlah postingan dihitung otomatis dari data acara.
// pengikut/mengikuti/postingan di bawah hanya cadangan bila data Instagram belum bisa dimuat (normalnya diambil otomatis dari /api/instagram).
export const profil = { bio: 'Majelis ta’lim untuk semua usia. Ngaji bareng, hati jadi tenang.', pengikut: '–', mengikuti: '–' }

// tone: green | leaf | ink
export const stories = [
  { id: 'jadwal', label: 'Jadwal', icon: 'calendar_month', slides: [
    { tone: 'green', icon: 'calendar_month', title: 'Jadwal pekan ini', text: 'Ada 5 kajian untuk kamu, dari Senin sampai Ahad.', to: '/jadwal', cta: 'Lihat jadwal' },
    { tone: 'leaf', icon: 'schedule', title: 'Datang lebih awal', text: '15 menit sebelum mulai biar dapat tempat paling nyaman.' } ] },
  { id: 'acara', label: 'Acara', icon: 'event', slides: [
    { tone: 'ink', icon: 'event', title: 'Acara terdekat', text: 'Cek tanggal dan lokasi acara berikutnya, lalu nyalakan pengingat.', to: '/acara', cta: 'Lihat acara' } ] },
  { id: 'doa', label: 'Doa harian', icon: 'favorite', slides: [
    { tone: 'leaf', icon: 'favorite', title: 'Doa sebelum belajar', text: 'Ya Allah, tambahkanlah aku ilmu dan berilah aku pemahaman.' },
    { tone: 'green', icon: 'star', title: 'Doa sebelum tidur', text: 'Bismika Allahumma ahya wa bismika amut.' } ] },
  { id: 'tahu', label: 'Tahukah kamu', icon: 'star', slides: [
    { tone: 'green', icon: 'star', title: 'Tahukah kamu?', text: 'Senyum kepada saudaramu bernilai sedekah.' },
    { tone: 'ink', icon: 'article', title: 'Mulai dari kecil', text: 'Satu ayat sehari, setahun jadi 365 ayat.', to: '/artikel', cta: 'Baca artikel' } ] },
  { id: 'infaq', label: 'Infaq Jumat', icon: 'campaign', slides: [
    { tone: 'leaf', icon: 'campaign', title: 'Infaq Jumat', text: 'Untuk operasional kajian dan beasiswa TPA. Hubungi pengurus untuk info rekening.', to: '/kontak', cta: 'Hubungi pengurus' } ] },
]
export const nilai = [
  { judul: 'Ilmu yang bersanad', teks: 'Kajian disampaikan pemateri yang berpegang pada rujukan para ulama.', icon: 'article' },
  { judul: 'Terbuka untuk semua', teks: 'Laki-laki, perempuan, dan anak-anak. Datang saja, tanpa daftar.', icon: 'person' },
  { judul: 'Suasana hangat', teks: 'Ada tanya jawab dan teh hangat setelah kajian selesai.', icon: 'favorite' },
]

// Tempat gambar tampil. Rasio crop tiap tempat diatur di Admin → Pengaturan crop (def = bawaan).
export const PLACES = {
  beranda: { label: 'Beranda · kartu artikel', def: '1/1' },
  artikel: { label: 'Halaman Artikel · kartu', def: '1/1' },
  grid: { label: 'Profil · kotak grid postingan', def: '3/4' },
  feed: { label: 'Profil · postingan saat dibuka', def: '4/5' },
  cover: { label: 'Detail · sampul', def: '16/9' },
  galeri: { label: 'Detail · galeri foto', def: '4/3' },
  popup: { label: 'Pop-up acara', def: '16/9' },
}
export const RATIOS = [['1/1', 'Persegi 1:1'], ['4/5', 'Potret 4:5'], ['3/4', 'Potret 3:4'], ['2/3', 'Potret 2:3'], ['9/16', 'Story 9:16'], ['4/3', 'Lanskap 4:3'], ['3/2', 'Lanskap 3:2'], ['16/9', 'Lebar 16:9'], ['2/1', 'Banner 2:1'], ['21/9', 'Panorama 21:9']]

// Bawaan profil. Semua bisa diubah dari Admin → Profil (disimpan di Redis).
export const profilDefault = {
  bio: 'Majelis ta’lim untuk semua usia. Ngaji bareng, hati jadi tenang.',
  visi: 'Menjadi tempat belajar yang menenangkan dan menumbuhkan kecintaan pada ilmu agama.',
  misi: ['Menyelenggarakan kajian rutin yang mudah dipahami.', 'Membina generasi muda lewat TPA dan tahsin.', 'Mempererat ukhuwah antarjamaah.'],
}
