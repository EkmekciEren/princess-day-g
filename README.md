# Dünya Prensesler Günü — yaşayan bir tablo

Gülten için hazırlanmış, Botticelli/Pre-Rafaelit havasında, her şeyin yumuşakça hareket ettiği bir Rönesans tablosu. Vite + vanilla TypeScript, GitHub Pages'te yayınlanır.

## Düzenleme

Tüm metinler, şiir, renkler ve hareket ayarları **`src/config.ts`** dosyasında:

- `POEM`: akrostiş satırları (ilk harfler otomatik altın ve büyük yazılır)
- `TEXT`: başlık, isim, imza, dilek cümleleri, alt yazı
- `COLORS`, `MOTION`: palet, rüzgâr, paralaks ve parçacık sayıları

## İsteğe bağlı dosyalar (`public/`)

- `painting.jpg`: kendi tablon arka plan olur, hareketli katmanlar üstüne biner (`PAINTING` ayarları)
- `music.mp3`: müzik düğmesi bunu çalar; dosya yoksa tarayıcıda üretilen yumuşak bir arp müziği çalar

Dosyalar derleme sırasında algılanır; ekledikten sonra geliştirme sunucusunu yeniden başlat.

## Komutlar

```bash
npm install
npm run dev      # geliştirme
npm run build    # tip kontrolü + üretim derlemesi (dist/)
```

`main` dalına her push'ta GitHub Actions siteyi derleyip Pages'e yayınlar.

## Performans notu

Her hareketli parça (çiçek, yaprak kümesi, kol, saç tutamı…) kendi satır içi `<svg>`'si olan küçük bir "sprite"tır ve dönme noktası CSS `transform-origin` ile verilir. Tarayıcı her parçayı bir kez çizer, sonra yalnızca GPU'da döndürür. Sadece şekil değiştiren parçalar (etek ucu, saç, kurdele) yeniden çizilir. Kare hızı düşerse kalite kendiliğinden azalır; `prefers-reduced-motion` açıksa sahne durağan kalır.
