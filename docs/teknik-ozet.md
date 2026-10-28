# Harita animasyonu: teknik özet

"Evolution of India 3000 BC – 10000" videosunu üreten sistem. Repo: `thesecretstates3-del/ad`, dal `ccr-cdd15618-68zz3r`.

## Araçlar ve kütüphaneler
| Ne | Neden |
|---|---|
| Node.js 22 | Tüm betikler |
| `world-atlas` (Natural Earth 1:50m) | Gerçek ülke sınırları ve kıyı şeritleri |
| `topojson-client` | TopoJSON → GeoJSON, ülkeleri birleştirme (`merge`) |
| `d3-geo` | Mercator projeksiyonu, SVG path üretimi |
| `polygon-clipping` | İmparatorluk sınırlarını karayla kesiştirme, birleştirme, çıkarma |
| `polylabel` | Şeklin içindeki en geniş noktayı bulma (gözlerin yeri ve boyutu) |
| `flubber` | Dönemler arası şekil morph'u |
| SVG + vanilla JS | Animasyonun kendisi (çerçeve kütüphanesi yok) |
| Playwright (Chromium) | Sayfayı kare kare ekran görüntüsü olarak alma |
| ffmpeg (libx264) | Kareleri MP4'e çevirme |
| Inter fontu | Yıl sayacı ve etiketler |

## Dosyalar
- `scripts/eras.mjs`: Dönem listesi. Her dönemde `year`, `name`, `color`, `mood` ve sınır bilgisi var:
  - `poly`: elle çizilmiş [boylam, enlem] dış hattı (karayla kesiştirilir);
  - `countries`: modern ülke adları (Natural Earth adıyla birebir);
  - `extra` / `cut`: ek bölge ekleme ya da çıkarma;
  - `others`: aynı anda görünen ikinci ülkeler (örn. 1947 Pakistan);
  - `future: true`: "FICTIONAL FUTURE" etiketi.
- `scripts/build-geo.mjs`: Coğrafyayı ekran koordinatına çevirip `src/geo-data.js` dosyasını yazar.
- `src/index.html`: Sahne (okyanus, ızgara, kara, sınırlar, HUD, vinyet, grain).
- `src/animation.js`: Zaman çizelgesi ve tüm hareket; her kare `t` saniyesinin saf fonksiyonu.
- `scripts/render-video.cjs`: Playwright + ffmpeg ile `out/evolution-of-india.mp4`.
- `scripts/snapshot.cjs`: Belirli saniyelerden tek kare alma.

## Coğrafya hattı (build-geo.mjs)
1. Natural Earth'ten bölge ülkeleri birleştirilip "kara" maskesi oluşturulur.
2. Tarihî sınır için elle çizilen kaba poligon:
   - önce Chaikin ile yumuşatılır (2 tur);
   - sonra `roughen()` ile sıklaştırılıp gürültüyle kıpırdatılır (genlik 0.55°, 3 oktav). Böylece gerçek sınır gibi tırtıklı görünür;
   - 1 tur daha yumuşatılır.
3. Bu poligon karayla kesiştirilir. Sonuç: kıyılar gerçek, iç sınırlar yaklaşık.
4. Mercator projeksiyonu, boylam 56–104 ve enlem 2–41 aralığını 1920×1080'e sığdırır. Dikkat: `fitExtent`'e Polygon değil MultiPoint ver, yoksa d3 tüm dünyayı sığdırır.
5. Her dönem için şunlar kaydedilir: halkalar (büyükten küçüğe, minik adalar atılır), sınır kutusu, `polylabel` ile yüz noktası ve yarıçapı.

## Animasyon (animation.js)
- **Zamanlama:** giriş 2 sn, her geçiş 1.5 sn, her bekleme 3.4 sn, çıkış 3.5 sn. 25 dönem toplam ~126 sn.
- **Morph:** önceki dönemin en büyük halkası, `flubber.interpolate(..., {maxSegmentLength: 6})` ile yenisine dönüşür. Küçük adalar crossfade olur. Renk de RGB'de karışır.
- **Kamera:**
  - her dönemin sınır kutusuna göre ölçek ve konum hesaplanır (0.9–2.4×, üstte yazılara yer bırakılır);
  - geçişte easeInOutCubic kullanılır, ortada %10 geri nefes alır;
  - beklerken %3.5 yavaş yakınlaşma olur.
- **Gözler** (özgün tasarım):
  - beyaz elips göz, siyah göz bebeği, parlama noktası;
  - göz kapakları ülkenin renginde, kaşlar kalın yuvarlak çizgi;
  - boyut `clamp(r*0.2, 12, 34)`.
- **İfadeler (`MOODS`):** neutral, happy, proud, angry, sad, surprised, sleepy. Her biri şu değerlerle tanımlı:
  - üst ve alt kapak kapanma oranı;
  - kapak eğimi (kızgında iç köşe aşağı, üzgünde dış köşe aşağı);
  - kaş yüksekliği ve açısı, göz bebeği boyu.
  Dönemler arası değerler yumuşakça karışır.
- **Göz davranışı:**
  - 1.3 sn'de bir rastgele (seed'li) bakış;
  - 2.4–3.6 sn'de bir kırpma, bazen çift;
  - geçişte yıl sayacına yukarı bakma;
  - varışta elastik squash-and-stretch;
  - ikinci ülke varsa ona bakma.
- **Yıl sayacı:** iki yıl arasında easeInOut ile sayar (BC, AD ve modern yıl formatı), varışta elastik "punch" yapar.
- **Dönem adı:** renkli hap etiket; eskisi yukarı kayarak çıkar, yenisi aşağıdan girer.
- **Ekstralar:**
  - varışta yüzden yayılan halka;
  - alt zaman çizelgesi (her dönem bir nokta);
  - kurgusal gelecek rozeti;
  - yakınlaşınca solan deniz adları;
  - vinyet, grain, gölge, üstten parlaklık.
- **Belirlenimci (deterministik) çalışma:** Rastgelelik `hash(seed)` ile üretilir. Aynı `t` hep aynı kareyi verir. Bu sayede canlı önizleme ve kare kare render birebir aynı çıkar.

## Komutlar
```bash
npm install
npx playwright install chromium   # bir kere
npm run build                     # eras.mjs değişince
# önizleme: src/index.html'i tarayıcıda aç (boşluk = durdur, ←/→ = dönem atla)
npm run render                    # 1920x1080 30fps MP4 (bulutta ~25 dk)
npm run snapshot -- out 10 40     # 10. ve 40. saniyeden kare
```

## Yeni ülke videosu yapmak için
1. `eras.mjs` içinde `LAND` listesini yeni bölgenin ülkeleriyle değiştir.
2. `ERAS` listesini yeni dönemlerle yaz.
3. `build-geo.mjs` içinde projeksiyon kutusunu (boylam/enlem aralığı) ve deniz etiketlerini yeni bölgeye göre ayarla.
4. `npm run build`, sonra önizleme, sonra `npm run render`.

## Araştırma araçları
- **NexLev MCP:** kanal bilgisi, benzer kanallar, niş araması, kanal videoları, outlier videolar, yorumlar. Ücretsiz planda günlük sınır var: niş araması 5, benzer kanal 1; video izleme aracı kapalı.
- **Agent Reach:** `github.com/Panniantong/Agent-Reach`. Bulutta YouTube engelli olduğu için çalışmadı; PC'de çalışır.

## Eksikler / sonraki adımlar
- Müzik ve ses efekti yok.
- Rakip videoların kare analizi yapılamadı (YouTube erişimi gerekiyor).
- Bayrak, şehir ve nehir katmanları yok.
