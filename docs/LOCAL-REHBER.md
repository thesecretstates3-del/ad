# Yerel kurulum ve çalışma rehberi

Bu rehber buluttaki oturumda yapılan her şeyi kendi bilgisayarında yapman için:
- kurulum,
- video üretimi,
- rakip araştırması (NexLev, Agent Reach, yt-dlp ile kare analizi),
- yeni sohbette kullanacağın hazır komutlar.

Teknik ayrıntılar `docs/teknik-ozet.md` dosyasında, rakip verileri `research/rakip-analizi.md` dosyasında.

---

## 1. Bilgisayara kurulacaklar (bir kere)

| Program | Ne için | Windows | macOS |
|---|---|---|---|
| Node.js 18+ (LTS) | Animasyon ve render betikleri | https://nodejs.org | `brew install node` |
| Git | Projeyi indirme ve güncelleme | https://git-scm.com | `brew install git` |
| Python 3.10+ | Agent Reach, yt-dlp | https://python.org ("Add to PATH" kutusunu işaretle) | `brew install python` |
| ffmpeg | MP4 çıkarma, kare alma | `winget install ffmpeg` | `brew install ffmpeg` |
| yt-dlp | Rakip videoları, kanal listesi, yorum indirme | `pip install -U yt-dlp` | `pip3 install -U yt-dlp` |
| VS Code (önerilir) | Dosya düzenleme ve terminal | https://code.visualstudio.com | aynı |
| Claude Code veya Claude masaüstü (isteğe bağlı) | Yerelde Claude ile çalışmak | https://claude.com/claude-code | aynı |

Kurulumdan sonra terminali kapatıp yeniden aç. Kontrol için:
```bash
node -v && git --version && python --version && ffmpeg -version && yt-dlp --version
```

---

## 2. Projeyi kurma

Zip paketini kullanıyorsan klasörü aç ve 3. adımdan devam et. GitHub'dan almak istersen:
```bash
git clone https://github.com/thesecretstates3-del/ad.git
cd ad
git checkout ccr-cdd15618-68zz3r
```

Ardından:
```bash
npm install
npx playwright install chromium   # video render için tarayıcı (bir kere)
```

---

## 3. Video üretimi

| Komut | Ne yapar |
|---|---|
| `src/index.html` dosyasını tarayıcıda aç | Canlı önizleme (boşluk = durdur, ← → = dönem atla, alttaki çubukla sar) |
| `npm run build` | `scripts/eras.mjs` dosyası değiştikten sonra haritayı yeniden üretir |
| `npm run render` | `out/evolution-of-india.mp4` (1920×1080, 30fps) üretir |
| `npm run snapshot -- out 10 40` | 10. ve 40. saniyeden PNG kare alır |

### Yeni ülke videosu
1. `scripts/eras.mjs`:
   - `LAND` listesine bölgenin ülkelerini yaz. Adlar Natural Earth'teki gibi olmalı: "Turkey", "Indonesia", "Iran" vb.
   - `ERAS` listesine dönemleri yaz. Her dönemde `year`, `name`, `color`, `mood` ve sınır bilgisi bulunur. Sınırı şu dört yoldan biriyle verirsin:
     - `poly`: elle [boylam, enlem] noktaları;
     - `countries`: modern ülkeler;
     - `extra` / `cut`: ek bölge ekleme ya da çıkarma;
     - `others`: aynı anda görünen ikinci ülke.
   - `mood` değerleri: `neutral`, `happy`, `proud`, `angry`, `sad`, `surprised`, `sleepy`.
   - Gelecek dönemlere `future: true` ekle.
2. `scripts/build-geo.mjs`:
   - projeksiyon kutusunu yeni bölgeye göre değiştir (`[[56, 2], [104, 2], [104, 41], [56, 41]]`, yani boylam ve enlem sınırları);
   - `bgNames` listesine arka plandaki komşu ülkeleri yaz;
   - `seaLabels` deniz adlarını güncelle.
3. Sırasıyla `npm run build`, önizleme, `npm run render`.
4. Müzik ve ses efektini video editöründe ekle (CapCut, DaVinci Resolve vb.). Projede ses yok.

Not: 1858 öncesi sınırlar yaklaşık. Videonun açıklamasına "simplified / approximate" ve "future part is fictional" uyarısını koy.

---

## 4. Rakip araştırması (yerelde)

### 4a. yt-dlp ile kanal ve video verisi
Kanalın tüm videoları (id, başlık, izlenme, süre):
```bash
yt-dlp --flat-playlist --print "%(id)s|%(title)s|%(view_count)s|%(duration)s" "https://www.youtube.com/@MaxiMaps/videos" > maximaps.txt
```

Video detayı ve yorumlar (videoyu indirmeden):
```bash
yt-dlp --skip-download --write-info-json --write-comments "https://youtu.be/fB64CMbvaQM"
```

### 4b. Videoyu indirip kare analizi
Rakip videolar sadece analiz içindir. Kendi kanalına yükleme, içindeki görselleri kullanma.

Videoyu indir (1080p):
```bash
yt-dlp -f "bv*[height<=1080]+ba/b[height<=1080]" -o "rakip/%(id)s.%(ext)s" "https://youtu.be/fB64CMbvaQM"
```

Her 2 saniyede bir kare:
```bash
mkdir -p kareler
ffmpeg -i rakip/fB64CMbvaQM.webm -vf "fps=1/2,scale=960:-1" kareler/f_%04d.jpg
```

Sadece sahne değişimlerini yakala (geçişleri görmek için en iyisi):
```bash
mkdir -p sahneler
ffmpeg -i rakip/fB64CMbvaQM.webm -vf "select='gt(scene,0.25)',scale=960:-1" -vsync vfr sahneler/s_%04d.jpg
```

Tek resimde 16 kare (kontak sayfası, Claude'a göstermek için ideal):
```bash
ffmpeg -i rakip/fB64CMbvaQM.webm -vf "fps=1/5,scale=480:-1,tile=4x4" sayfa_%02d.jpg
```

Geçişi kare kare incelemek için (örnek: 30. saniyeden 3 saniyelik, 30fps):
```bash
mkdir -p gecis
ffmpeg -ss 30 -t 3 -i rakip/fB64CMbvaQM.webm -vf "scale=960:-1" gecis/g_%03d.jpg
```

Ses (müzik ve efekt temposunu dinlemek için):
```bash
ffmpeg -i rakip/fB64CMbvaQM.webm -vn ses.mp3
```

Sonra bu kareleri Claude'a ver. Örnek istek: "`kareler/` ve `sayfa_*.jpg` dosyalarına bak; renkleri, göz tasarımını, yazı yerleşimini, geçiş türlerini ve her dönemin süresini çıkar."

### 4c. Agent Reach
Ajanların YouTube, GitHub, Reddit gibi platformlara erişmesini sağlayan araç: https://github.com/Panniantong/Agent-Reach

Uyarı: PyPI'daki `agent-reach` paketi bu proje değil. GitHub'dan kur.

Kolay yol: Claude Code'a şunu söyle:
```
Install Agent Reach: https://raw.githubusercontent.com/Panniantong/Agent-Reach/main/docs/install.md
```

Elle kurulum:
```bash
git clone https://github.com/Panniantong/Agent-Reach.git
cd Agent-Reach
python -m venv .venv
# Windows: .venv\Scripts\activate    macOS/Linux: source .venv/bin/activate
pip install -e .
agent-reach setup
```

Kullanım:
```bash
agent-reach doctor                                        # hangi kanallar çalışıyor
agent-reach youtube search "evolution of country map animation"
agent-reach read https://youtu.be/fB64CMbvaQM            # video bilgisi
agent-reach channels                                      # tüm kanallar ve komutlar
```

### 4d. NexLev
NexLev, claude.ai hesabına bağlı bir bağlayıcı (connector). Aynı hesapla giriş yaptığın Claude masaüstü, Claude Code veya claude.ai sohbetinde araçları görünür. Görünmezse claude.ai → Settings → Connectors bölümünden kontrol et.

Kullandığımız araçlar ve ne işe yaradıkları:

| Araç | Ne verir |
|---|---|
| `channel_resolver` | Kanal linki → kanal ID |
| `youtube_channel_about` | Abone, toplam izlenme, açılış tarihi, açıklama |
| `youtube_channel_videos` (sort: popular) | Kanalın en çok izlenen videoları, süreleri |
| `get_similar_channels` | Benzer, yani rakip kanallar |
| `search_niche_finder_channels` | Konuya göre kanal arama (gelir, aylık izlenme, outlier) |
| `faceless_outliers_videos` | Kanal ortalamasının çok üstüne çıkan videolar |
| `youtube_video_comments` | İzleyici yorumları, talepler, şikâyetler |

Ücretsiz plan sınırları: niş araması günde 5, benzer kanal günde 1. Video izleme aracı ücretli planda.

---

## 5. Yeni sohbette kullanacağın hazır mesaj

```
Bu klasörde bir harita animasyonu projesi var. Önce docs/LOCAL-REHBER.md,
docs/teknik-ozet.md ve research/rakip-analizi.md dosyalarını oku.
Sonra: [buraya isteğin, örn. "Evolution of Indonesia 3000 BC – 10000 videosunu hazırla:
eras.mjs'i Endonezya dönemleriyle yaz, projeksiyonu bölgeye göre ayarla,
build al, birkaç kare göster, sonra render et."]
Rakip analizi gerekiyorsa yt-dlp ve ffmpeg ile kare çıkar ve kareleri incele.
Göz karakterini ve tasarımı özgün tut, rakiplerin görsellerini kopyalama.
```

---

## 6. Klasör yapısı

```
ad/
├─ src/
│  ├─ index.html          sahne
│  ├─ animation.js        tüm hareket ve gözler
│  ├─ geo-data.js         üretilen harita verisi (npm run build)
│  └─ flubber.min.js      morph kütüphanesi
├─ scripts/
│  ├─ eras.mjs            DÖNEMLER, burayı düzenle
│  ├─ build-geo.mjs       coğrafya hattı
│  ├─ render-video.cjs    MP4 render
│  └─ snapshot.cjs        tek kare
├─ docs/
│  ├─ LOCAL-REHBER.md     bu dosya
│  └─ teknik-ozet.md      teknik ayrıntılar
├─ research/
│  └─ rakip-analizi.md    rakip kanallar ve öneriler
└─ out/                   render çıktısı (git'e girmez)
```
