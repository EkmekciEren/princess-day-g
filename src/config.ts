/* ==========================================================================
 *  DÜZENLENEBİLİR İÇERİK — tüm metinler, renkler ve hareket ayarları burada.
 *  (Editable content: every visible text, colour and motion knob lives here.)
 * ========================================================================== */

/**
 * Akrostiş şiir. Her satırın İLK HARFİ otomatik olarak altın ve büyük
 * yazılır; harfler yukarıdan aşağı okunduğunda isim çıkar (G-Ü-L-T-E-N).
 * Satırları değiştirebilirsin; baş harfi ayrıca yazmana gerek yok.
 */
export const POEM: readonly string[] = [
  'Gözlerinde bahar başlar,',
  'Üşüyen günlerimi ısıtırsın,',
  'Limanım, huzurum, evim olursun,',
  'Tebessümünle çiçek açar dünya,',
  'Ellerin elimde, her şey güzel,',
  'Nefesim, neşem, en güzel hikâyemsin.',
];

/** Sayfadaki diğer tüm metinler. */
export const TEXT = {
  caption: 'Dünya Prensesler Günü Kutlu Olsun',
  name: 'Gülten',
  signature: '— Eren',
  scrollHint: 'aşağı kaydır',
  wishButton: 'Bir dilek tut',
  /** "Bir dilek tut" her tıklandığında sıradaki cümle gösterilir. */
  wishes: [
    'Dileğin yıldızlara ulaştı. Benimki çoktan gerçek oldu: sen.',
    'Ne dilersen dile, her dileğinde yanında olacağım.',
    'Dilerim bütün baharlar senin gülüşünle başlasın.',
    'Bu masalın prensesi hep sen olacaksın.',
    'Bir dilek hakkım daha olsaydı, yine seni dilerdim.',
  ],
  footer: 'Seni seviyorum',
  footerEmoji: '🌹',
  musicOn: 'Müziği kapat',
  musicOff: 'Müziği aç',
  tiltInvite: 'Telefonunu hafifçe eğ, tablo seninle hareket etsin',
  curtainLabel: 'Prensesime',
} as const;

/** Sekme başlığı, paylaşım önizlemesi (WhatsApp vb.) ve tarayıcı rengi. */
export const SITE = {
  title: 'Gülten için · Dünya Prensesler Günü',
  description: 'Dünya Prensesler Günü kutlu olsun, Gülten. Senin için yaşayan bir Rönesans tablosu.',
  themeColor: '#5A1F2B',
  /** Yayın adresi; paylaşım görseli için mutlak URL gerekir. */
  url: 'https://ekmekcieren.github.io/princess-day-g/',
  ogImage: 'og-image.jpg',
} as const;

/** Ana palet (CSS değişkenleri de bunlardan üretilir). */
export const COLORS = {
  cream: '#F3E6CF',
  rose: '#D9A5A0',
  sage: '#9CAF88',
  gold: '#C9A24B',
  burgundy: '#5A1F2B',
  goldLight: '#F1DC97',
  goldDeep: '#8A6A24',
  ink: '#3B1820',
} as const;

/** Hareket ayarları. Değerleri küçültmek sahneyi daha da sakinleştirir. */
export const MOTION = {
  /** Aynı tohum → aynı (ama organik) düzen. Değiştirirsen çiçekler yer değiştirir. */
  seed: 20261118,
  /** Rüzgâr esintisi aralığı (saniye). */
  gustEvery: [10, 15] as [number, number],
  /** İlk esinti, perde kalktıktan kaç saniye sonra. */
  firstGust: 6.5,
  /** Fare / telefon eğimi paralaksı (piksel, en derin katman için). */
  parallax: { x: 22, y: 10 },
  /** Kaydırınca katmanların yukarı kayması (piksel, en ön katman). */
  scrollShift: 28,
  /** Ekrandaki parçacık sayıları: [telefon, masaüstü]. */
  petals: [14, 26] as [number, number],
  dust: [20, 38] as [number, number],
  butterflies: [2, 3] as [number, number],
} as const;

/**
 * İsteğe bağlı kendi tablon: public/painting.jpg koyarsan arka plan olur,
 * hareketli katmanlar üstüne biner. Hangi SVG katmanlarının kalacağını seç.
 */
export const PAINTING = {
  file: 'painting.jpg',
  keepPrincess: true,
  keepFrontFlowers: true,
  keepGardenFigures: false,
} as const;

/** İsteğe bağlı müzik: public/music.mp3 yoksa tarayıcıda üretilen arp müziği çalar. */
export const MUSIC = {
  file: 'music.mp3',
  volume: 0.55,
} as const;
