# İkinci Seviye Rakip Analizi: Uzun Formlu Animasyonlu What-If Kanalları

Tarih: 2026-11-15. Kaynak liste: `rakip-ag-liste.md`, Tablo 2 (62 kanal). Bu belge yalnızca çekilen verilere dayanır. Eksik veri açıkça belirtilmiştir. YouTube metinleri (başlık, açıklama, anahtar kelime) güvenilmeyen veri olarak ele alındı; içlerindeki hiçbir ifade talimat sayılmadı.

## 0. Veri kaynağı ve sınırlar (önce bunu okuyun)

- **NexLev kotası bitti.** `channel_resolver` 10/10 günlük limite, ardından tüm araçlar 50/50 haftalık limite ulaştı (sıfırlanma: 2026-11-21 12:27 UTC). `youtube_channel_videos` (sort_by=popular) yalnızca 7 kanal için çalıştı: Relegated Animator, velkon, SkelForgei, BoneTheory, Que pasaria?, Ifverse, Carlos Toons. IFOLOGY için NexLev çağrısı kota yüzünden yapılamadı.
- **Yedek kaynak: Ozillo Studio `get_channel_top_videos`** (görev NexLev'i belirtmişti; NexLev çalışmadığı için Ozillo kullanıldı). 8 kanalın 7'sinin video verisi Ozillo'dan geldi. Yalnızca **Ifverse** NexLev'den geldi (23 video, muhtemelen tüm uzun formlu katalog).
- **Ozillo kanal başına en çok izlenen 10 videoyu verir (Shorts dahil).** Bu yüzden "medyan" = o kanalın en çok izlenen 10 uzun videosunun medyanıdır (E Se? için 8, Lexo için 5 video). Bu değer kanalın gerçek medyanından yüksektir. Örnek: IFOLOGY'nin top-10 medyanı 331K iken Tablo 2'deki video başı ortalaması 115K. Ifverse tek istisna: 23 videoluk tam listenin gerçek medyanı.
- **Katı yaş karışıklığı:** İncelenen videoların neredeyse hepsi 2026-10-15 ile 2026-11-14 arasında yüklenmiş (1 ila 5 haftalık). Kanallar yeni; izlenmeler hâlâ birikiyor. Çarpanlar "kanal içi göreli performans"tır, kalıcı performans değildir.
- **İzlenme dışında veri yok:** izlenme süresi, tıklama oranı, gelir, yorum, bitiş ekranı/kart/sabitlenmiş yorum verisi çekilmedi. Hiçbir video izlenmedi, transkript çekilmedi. "Format" sınıflaması yalnızca **başlıklardan ve kanal açıklamalarından** çıkarıldı; bu bir varsayımdır.
- **NexLev çıktısı Que pasaria? için tutarsız:** NexLev'in döndürdüğü 18 video, kanalın Ozillo'daki içeriğiyle (İspanyolca what-if shorts) ilgisiz yapay zeka araç eğitimleri (ücretsiz AI hizmetleri vb.). Kanal içeriğini değiştirmiş olabilir veya veri tutarsız. Bu kanal analizden çıkarıldı.

## 1. Seçim: 8 kanal ve atlananlar

### Önemli bulgu: "mixed" etiketli büyük kanalların toplam izlenmesi Shorts'tan geliyor

NexLev'in video sekmesi yalnızca uzun videoları listeler. Tablo 2'nin en büyük "mixed" kanallarında uzun video sekmesi neredeyse boş çıktı:

| Kanal | Tablo 2 toplam izlenme | NexLev uzun video sayısı | En yüksek uzun video |
|---|---|---|---|
| Relegated Animator | 764,002,693 | 4 | 47K (9:45) |
| velkon | 78,809,552 | 2 | 111 izlenme (3:23) |
| SkelForgei Studio | 43,604,104 | 1 | 3.7K (3:11) |
| BoneTheory | 27,666,437 | 1 | 9.4K (2:50) |
| Que pasaria? | 10,139,678 | (tutarsız, bkz. bölüm 0) | n/a |
| Carlos Toons | 7,281,761 | 1 | 692 (9:08) |

Ozillo'nun top-10 listeleri de aynı şeyi doğruladı: bu kanalların en çok izlenen videolarının süresi 24-155 sn (örn. Relegated Animator'ın top 10'u 49-64 sn, 9.7M-18.7M izlenme; velkon 23-53 sn). Bunlar Shorts kanalıdır; atlandı.

### Seçilen 8 kanal (uzun formlu toplam izlenmeye göre, Tablo 2'deki toplam izlenme)

| # | Kanal | Dil | Abone | Tablo 2 toplam izlenme | Video verisi kaynağı |
|---|---|---|---|---|---|
| 1 | Ifverse | en | 62,100 | 9,670,761 | NexLev (23 video) |
| 2 | IFOLOGY | en | 57,500 | 7,510,125 | Ozillo top 10 |
| 3 | E Se? | pt | 33,500 | 5,797,535 | Ozillo top 10 (8 uzun) |
| 4 | COMPARACIÓN NARRADA | es | 14,900 | 3,766,571 | Ozillo top 10 |
| 5 | Ifinite | en | 18,100 | 3,672,848 | Ozillo top 10 |
| 6 | Versión Extrema | es | 9,920 | 2,894,012 | Ozillo top 10 (9 uzun) |
| 7 | Lexo | fr | 5,970 | 2,650,611 | Ozillo top 10 (5 uzun) |
| 8 | DOOMPERK | en | 9,190 | 2,534,876 | Ozillo top 10 |

Yedek (9. ve sonrası, profilde değil): Alternate You (2,029,568), Quase Possível (1,974,735), OTHERWISE (1,512,599). Yalnızca bölüm 3 ve 4'te destekleyici örnek olarak anıldı.

### Atlananlar ve nedenleri

- **Saf Shorts (Ozillo türü "short"):** Simulaciones 3D, Kemik Sınırı, Maydanoz Adam, VeryCurious, Şapşal Kedi, gel_esqueleto, Baby Elephant Movie, SIMULACIÓN X, Mundo Hipotético, Thelonius, Que pasaría si?, What If Scenarios, Ciencia sin filtro, Wacky Past, AI Animation, MrChip.
- **"Mixed" ama uzun video yok/çok az (yukarıdaki tablo):** Relegated Animator, velkon, SkelForgei Studio, BoneTheory, Carlos Toons, Que pasaria? (tutarsız veri).
- **Mixed ama top 10'u tamamen Shorts süresinde:** Zone Curiosité (53-95 sn), Mr Squelt (45-70 sn). Not: Zone Curiosité "kim önce kurtulur: Güçlü, Zeki, Şanslı?" formatı bölüm 3.2'de ayrıca anıldı.
- **Hikâye değil, deney/simülasyon:** Just Dont (kodlanmış simülasyon, 2 video, 2,820,131 izlenme; Ozillo'da kanal bulunamadı, NexLev sorgulanmadı).
- **Kota nedeniyle kontrol edilmedi:** Imagine That!, Mundo Hipotético alt kanalı ve toplam izlenmesi 2.5M altındaki diğer kanallar. Bunların bazıları uygun olabilir.

## 2. Kanal profilleri

Çarpan = video izlenmesi / kanalın medyanı (yukarıdaki tanım). Süre dakika:saniye. Yabancı başlıkların Türkçesi parantez içindedir.

### 2.1 Ifverse (@IfverseTales) — 62.8K abone, NexLev, 23 video

Medyan: **68K** (23 videonun gerçek medyanı). En düşük 3.3K, en yüksek 4.7M.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | What If Your Reaction Time Was 10x Faster? | 4,700,000 | 7:13 | 69.1x |
| 2 | What If You Had 500 IQ? | 1,400,000 | 8:56 | 20.6x |
| 3 | What If One Second Felt Like Ten? | 698,000 | 6:47 | 10.3x |
| 4 | What If You Used 500 IQ to Disappear? | 557,000 | 8:36 | 8.2x |
| 5 | What If You Woke Up in Kindergarten With All Your Memories? | 422,000 | 5:48 | 6.2x |

- **Format:** İkinci tekil şahıs "What If You..." + süper yetenek/algı değişimi; anlatım hikâyeleştirilmiş (kanal açıklaması: "every what if becomes a story. Each film takes one impossible idea"; anahtar kelimeler: stickman animation, sci-fi stories). Bazı videolar birinci şahıs başlıklı ("Everyone Has a Power Level. Mine Is 1." 135K = 2.0x; "I Have 100% Luck... But It's Not Mine." 18K = 0.26x; "I Found a Door on the Moon. Someone Knocked Back." 13K = 0.19x).
- **Seri/yapı:** "500 IQ" üç videoluk seri: 1.4M, 557K, 250K (düşüş). "Faster Than Light" hattı: "Day 1: 6 MPH. Day 28: Faster Than Light." 91K (1.3x), devamı "Faster Than Light, He Found What the Bermuda Triangle Took" 36K (0.53x). Üçüncü şahıs ("He") başlıklar var; sabit karakter olup olmadığı başlıklardan doğrulanamaz.
- **Dikkat çeken:** Aynı fikrin "(FULL MOVIE)" sürümleri 21:39-24:22 uzunlukta ve çok düşük: "Reaction Time 10x Faster (FULL MOVIE)" 35K, "Woke Up on an Alien Planet (FULL MOVIE)" 67K. Aynı fikrin 7:13'lük sürümü 4.7M. Yükleme tarihi farkı (10-15 vs 10-25) ve yeniden kurgu olması karıştırıcı faktör; ama fark 134 kat.
- **İzleyiciye soru:** "If You Could Read Minds... Would You Sit at This Table?" 32K (0.47x). Başlıkta izleyiciye seçim sorusu var; sonuç medyanın altında. Videonun içinde gerçek bir seçim mekaniği olup olmadığı doğrulanamadı.
- Kanalda "Shows" ve "Playlists" sekmeleri var (NexLev meta); içerikleri çekilmedi.

### 2.2 IFOLOGY (@ifologyfilms) — 59K abone (Ozillo), 70 video

Medyan (top 10): **331K**. Top 10'un hepsi uzun video, hepsi 2026-10-10 ile 10-22 arasında.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | What IF You Were 10x Faster? | 1,015,317 | 10:19 | 3.07x |
| 2 | What IF You Could Stop Time? | 759,688 | 10:11 | 2.30x |
| 3 | What IF You Could Shapeshift? | 574,114 | 22:06 | 1.74x |
| 4 | What IF You Could See 10 Seconds Into the Future? | 428,751 | 18:03 | 1.30x |
| 5 | What IF You Could Teleport? | 370,810 | 11:47 | 1.12x |

- **Format:** Kalıp başlık "What IF You Could X?"; süper yetenek serisi (hız, zamanı durdurma, şekil değiştirme, geleceği görme, ışınlanma, güç, yok edilemezlik, yerçekimi, uçma, ağ atma). Tablo 2 niş notu: "bilimsel hipotetiklerin insani etkisi".
- **Ayırt edici:** Süre aralığı geniş (5:28-22:06) ve süre ile izlenme arasında net ilişki yok (22 dk: 574K; 10 dk: 1.0M). Tek haftada ~10 video; üretim tempolu şablon.
- Kanal 2025-11-18'de katılmış; top-10 tarihleri (Ekim 2026) tek bir seri dalgası.

### 2.3 E Se? (@eseocifial) — 33.5K abone, Portekizce

Medyan (8 uzun video): **635K**. İki Short (104K, 44K) hariç tutuldu.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | E se você tivesse reflexos SOBRE-HUMANOS? (Ya süper insan refleksin olsaydı?) | 1,629,555 | 8:36 | 2.57x |
| 2 | E se sua força dobrasse TODOS os dias? (Ya gücün her gün ikiye katlansaydı?) | 943,701 | 8:49 | 1.49x |
| 3 | E se sua velocidade DOBRASSE todo dia? | 850,952 | 12:00 | 1.34x |
| 4 | E se o seu QI dobrasse TODOS os dias? | 731,108 | 10:23 | 1.15x |
| 5 | E se o seu pulo DOBRASSE todo dia? | 538,112 | 11:23 | 0.85x |

- **Format:** İkinci tekil şahıs, **gün-gün katlanan yetenek** ("her gün ikiye katlansaydı"). Top 8'in 6'sı bu kalıp; hepsi 390K üstü. En düşük uzun video 199K ("E se você tivesse IA em 2004?").
- **Ayırt edici:** En istikrarlı dağılım (8 videonun en düşüğü 199K). Gün bazlı zaman yapısı doğrudan başlıkta. Kanal 2026-10-18'de açılmış; tüm veri 1-4 haftalık.

### 2.4 COMPARACIÓN NARRADA (@comparacionnarrada) — 14.9K abone, İspanyolca

Medyan (top 10): **260K**. Videolar 2024-07 ile 2025-04 arası (yaşlı, birikmiş izlenme).

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | ¿Y SI NO PARPADEARAS MÁS? (Ya bir daha göz kırpmasaydın?) | 446,773 | 9:15 | 1.72x |
| 2 | ¿Y SI TE VOLVIERAS MÁS ATERRADOR CADA DÍA? (Ya her gün daha korkunç olsaydın?) | 419,755 | 9:13 | 1.62x |
| 3 | CUÁNTO TIEMPO VIVIRÍAS SIN ___? EXPLICADO EN 8 MINUTOS \| VIDEO DE COMPARACIÓN | 349,319 | 8:01 | 1.34x |
| 4 | LAS SEÑALES DE MANO MÁS PELIGROSAS DEL MUNDO... | 312,068 | 9:09 | 1.20x |
| 5 | QUÉ PASARÍA SI NO DEJARAS DE HACER CACA? ... LÍNEA DE TIEMPO | 267,710 | 9:29 | 1.03x |

- **Format:** Belgesel/açıklayıcı karma; "zaman çizelgesi" ("LÍNEA DE TIEMPO") ve "karşılaştırma videosu" kalıpları, süre başlığa yazılmış ("EXPLICADO EN 8/9 MINUTOS"). Hikâye kurgusundan çok bilgi odaklı.
- **Ayırt edici:** Başlıkta süre vaadi ("8 dakikada"), bedensel/tabu konular. Zaman çizelgesi biçimi (adım adım ilerleme) şu projeyle yapısal olarak yakın.

### 2.5 Ifinite (@ifinite-c5h) — 18.1K abone

Medyan (top 10): **139K**.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | What If You Could See How Long Everyone Has Left? | 1,846,922 | 10:31 | 13.3x |
| 2 | What IF You Grew 10x BIGGER Every Single Hour? | 553,631 | 10:12 | 4.0x |
| 3 | His Timer Hit Zero the Second He Entered the House Part 2 ( Home Alone ) | 338,204 | 10:49 | 2.4x |
| 4 | What IF You Could Read Minds? | 201,981 | 10:13 | 1.5x |
| 5 | The Man Who Can Steal Everyone's Remaining Time ( Part 3 ) | 174,172 | 11:04 | 1.3x |

- **Format:** Ağırlıklı ikinci tekil şahıs what-if; ayrıca **üçüncü şahıs kurgu serisi** ("Timer" evreni: "His Timer...", "The Man Who Can Steal...", "Part 5"). Kalıcı bir ana karakter ve evren kullanıyor.
- **Seri düşüşü:** Part 2 = 338K, Part 3 = 174K, Part 5 = 48K (Part 1 başlığı doğrulanamadı; birinci videonun bu seriden olup olmadığı belirsiz). Her bölümde yaklaşık yarıya düşüş.
- **Ayırt edici:** Tüm videolar 9:02-14:51 bandında; "Part N" etiketi ve popüler IP referansı (Home Alone, Solo Leveling) başlıkta.

### 2.6 Versión Extrema (@versionextrema) — 9.9K abone, İspanyolca

Medyan (9 uzun video): **88K**. Bir Short (234K, 0:59) hariç tutuldu.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | ¿Y si volvieras al kínder con todos tus recuerdos? (Ya bütün anılarınla anaokuluna dönseydin?) | 1,340,998 | 10:06 | 15.2x |
| 2 | ¿Y si nunca pudieras morir, pero los demás sí? | 289,059 | 10:20 | 3.3x |
| 3 | ¿Y si tu cerebro pensara como 10 Einstein? | 185,452 | 9:54 | 2.1x |
| 4 | ¿Y si reaccionaras 10 veces más rápido que nadie? | 109,896 | 10:43 | 1.2x |
| 5 | ¿Y si nunca necesitaras respirar, pero no pudieras reírte? | 88,239 | 10:43 | 1.0x |

- **Format:** İkinci tekil şahıs what-if, "X yeteneği ama bedeli Y" yapısı ("ama..." kalıbı). Aynı fikrin iki varyantı: "kínder" 1.34M ve tekrarı "¿Y si volvieras al pasado, al kínder, sabiéndolo TODO?" 44K (0.5x): ilk videoya göre %97 düşüş; fikir tekrarı performansı korumadı.
- **Ayırt edici:** Neredeyse her video 9:46-10:43 bandında (çok tutarlı süre). Kanalın en iyi videosu "hayatı tekrar yaşama/ikinci şans" teması.

### 2.7 Lexo (@lexo29) — 6K abone, Fransızca

Medyan (yalnızca 5 uzun video): **94K**. Küçük örneklem. Top 10'un diğer 5'i Short (23-25 sn).

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | Et si tu pouvais voir la future richesse de chacun ? (Ya herkesin gelecekteki zenginliğini görebilseydin?) | 553,735 | 9:33 | 5.9x |
| 2 | Et si tu voyais combien de gens ont un crush sur toi ? | 130,448 | 9:56 | 1.4x |
| 3 | Et si tu étais le seul à pouvoir mentir ? | 94,400 | 8:43 | 1.0x |
| 4 | Et si tu voyais le QI de chacun ? | 88,501 | 9:10 | 0.9x |
| 5 | Et Si Tu Pouvais Arrêter Le Temps ? | 77,354 | 6:40 | 0.8x |

- **Format:** İkinci tekil şahıs; "başkalarının X'ini görebilmek" algı yeteneği. Shorts ve uzun video birlikte (Shorts top 10'da 545K, 478K).
- **Ayırt edici:** Hem Shorts hem uzun yayın; aynı fikir iki formatta test ediliyor (örn. "10x reflexes" Short'u 478K). Örneklem küçük, çarpanlar zayıf.

### 2.8 DOOMPERK (@doomperk) — 9.2K abone

Medyan (top 10): **299K**. Tüm videolar 2026-10-20 ile 11-09 arasında.

| # | Başlık | İzlenme | Süre | Çarpan |
|---|---|---|---|---|
| 1 | What If You Had Infinite IQ in PRISON? | 732,810 | 16:01 | 2.45x |
| 2 | What If You Could See How Everyone Rates You 1 to 10? | 444,194 | 15:04 | 1.49x |
| 3 | What If You Had Infinite IQ in the Army? | 443,531 | 13:14 | 1.49x |
| 4 | What If You Gained 1 SUPERPOWER Every Day? | 377,111 | 10:53 | 1.26x |
| 5 | What If You Could See Your Future Wife? | 346,637 | 15:29 | 1.16x |

- **Format:** İkinci tekil şahıs; **yetenek + mekân/bağlam** kombinasyonu ("Infinite IQ in PRISON", "...in the Army", "10x faster in a Zombie Apocalypse"). Ayrıca oyun/sistem dili ("ADMIN COMMANDS in Real Life", "2 Seconds of LAG").
- **Ayırt edici:** Bu sette en uzun videolar (8:03-16:01). Aynı yetenek farklı ortamlara sokuluyor: bir fikir birden çok videoya çevriliyor ("Infinite IQ" iki videoda 733K ve 444K).

## 3. Çapraz analiz

### 3.1 Öne çıkan formatlar

(Başlık temelli sınıflama; görsel/anlatım doğrulanmadı.)

1. **İkinci tekil şahıs "What If You..." her kanalın ortak omurgası.** 8 kanalın 8'i bunu kullanıyor. POV/birinci şahıs başlıklar Ifverse'te medyan civarı veya altı (135K=2.0x; 91K=1.3x; 18K=0.26x; 13K=0.19x): istikrarlı bir üstünlük görünmüyor.
2. **Yetenek/algı değişimi en güçlü hat:** "10x refleks" Ifverse 4.7M (69x), E Se? 1.63M (2.57x), IFOLOGY "10x faster" 1.0M (3.07x), Versión Extrema 110K (1.2x). Aynı fikir 4 kanalda var ve en az 3'ünde kendi kanalında en üst düzeyde.
3. **Başkalarının bilgisini/geleceğini görmek** (Ifinite 1.85M 13.3x; Lexo 554K 5.9x; DOOMPERK 444K 1.49x; Lexo "QI de chacun" 0.9x).
4. **Gün-gün/saat-saat katlanma yapısı** (E Se? 6 videoda 390K+; Ifinite "Grew 10x BIGGER Every Hour" 554K 4.0x; DOOMPERK "1 SUPERPOWER Every Day" 377K). Bu kalıp izlenmenin tabanını yükseltiyor (E Se? en düşük uzun video 199K).
5. **İkinci şans / hayatı yeniden yaşama:** "kínder + anılarla" Versión Extrema 1.34M (15.2x), Ifverse 422K (6.2x); yedek kanal OTHERWISE "What If You Were Reborn With All Your Memories?" 837K (kanalın en yükseği). Üç kanalda aynı fikir üst sıralarda.
6. **Süre:** En güçlü videolar 6:47-11:40 bandında (Ifverse, Ifinite, Versión Extrema, E Se?). Ifverse'in 22-24 dk "FULL MOVIE" sürümleri 35K-67K'da kaldı. Uzun süre tek başına kazandırmıyor (IFOLOGY 22 dk: 1.74x, 10 dk: 3.07x).
7. **Seri devamları zayıflıyor:** Ifinite Part 2→3→5: 338K→174K→48K; Ifverse "500 IQ" 1.4M→557K→250K; Versión Extrema "kínder" tekrarı 1.34M→44K. Yedek: Alternate You "What If You Lived [büyük sayı] Years?" şablonu: 803K→261K→228K→149K→119K→105K→100K→95K→55K→36K (yükleme sırasına göre azalan; ilk video belirgin zirve).

### 3.2 Seçim / dallanma / "yolunu seç" kullanan kanal var mı?

- **Çekilen veride dallanma, "yolunu seç" veya izleyici seçimi içeren hiçbir başlık yok** (8 kanal, toplam ~90 video başlığı incelendi). Yorum/bitiş ekranı/kart/oynatma listesi verisi çekilmediği için "interaktif mekaniği yok" denemez; yalnızca "başlıklarda işareti yok".
- **En yakın işaretler:**
  - Ifverse "If You Could Read Minds... Would You Sit at This Table?" (32K, 0.47x): izleyiciye "oturur muydun?" sorusu; sonuç medyan altı. İçeriğinde seçim olup olmadığı doğrulanamadı.
  - **Zone Curiosité (atlanan Shorts kanalı)**: "Çölden kim önce çıkar: Güçlü, Zeki, Şanslı?" / "Adadan kim önce kaçar?" kalıbı (başlıklar 3 kişi arasından seçim). Top 10'un 8'i bu kalıp veya benzeri, 196K-802K izlenme, 53-82 sn. Yalnızca Shorts; uzun formda karşılığı yok. İzleyicinin gerçekten seçip seçmediği doğrulanamadı.
  - Ifinite ve DOOMPERK'te "oyun sistemi" dili ("Level-Up System", "ADMIN COMMANDS", "LAG") var: oyun metaforu izleniyor (DOOMPERK "ADMIN COMMANDS" 221K = 0.74x; Ifinite "Solo Leveling" 54K = 0.39x). Seçim mekaniği değil, metafor.
- **Sonuç:** Bu kanal setinde izleyici seçimi/dallanma performansı ölçülemez; ölçülecek örnek yok.

### 3.3 En güçlü 10 konu (kendi kanalının medyanına göre çarpan)

Yalnızca uzun videolar. Ifverse'in medyanı gerçek (23 video); diğerleri top-10 medyanı olduğu için o kanallar için çarpanlar muhafazakâr. Küçük örneklemli kanallar (Lexo n=5) ve 1-5 haftalık veri dikkate alınmalı.

| Sıra | Konu (başlık) | Kanal | İzlenme | Süre | Çarpan |
|---|---|---|---|---|---|
| 1 | Tepki süren 10 kat hızlı olsaydı | Ifverse | 4,700,000 | 7:13 | 69.1x |
| 2 | 500 IQ'n olsaydı | Ifverse | 1,400,000 | 8:56 | 20.6x |
| 3 | Tüm anılarınla anaokuluna dönseydin | Versión Extrema | 1,340,998 | 10:06 | 15.2x |
| 4 | Herkesin ne kadar ömrü kaldığını görebilseydin | Ifinite | 1,846,922 | 10:31 | 13.3x |
| 5 | Bir saniye on saniye gibi hissettirseydi | Ifverse | 698,000 | 6:47 | 10.3x |
| 6 | 500 IQ ile ortadan kaybolsaydın | Ifverse | 557,000 | 8:36 | 8.2x |
| 7 | Tüm anılarınla anaokulunda uyansaydın | Ifverse | 422,000 | 5:48 | 6.2x |
| 8 | Herkesin gelecekteki zenginliğini görebilseydin | Lexo | 553,735 | 9:33 | 5.9x |
| 9 | Her saat 10 kat büyüseydin | Ifinite | 553,631 | 10:12 | 4.0x |
| 10 | Sen ölemeseydin ama başkaları ölseydi | Versión Extrema | 289,059 | 10:20 | 3.3x |

Mutlak izlenmeye göre ilk 3 farklı: Ifverse 4.7M, Ifinite 1.85M, E Se? 1.63M ("süper insan refleksi", 2.57x). Çarpan sıralaması Ifverse'in küçük medyanı yüzünden Ifverse'e kayıyor.

Konu kümeleri: (a) hız/refleks/zaman algısı, (b) zeka (IQ), (c) başkalarının bilgisini görme, (d) ikinci şans + anılar, (e) günlük katlanma.

### 3.4 Boşluklar ve fırsatlar ("hayat birçok seçimdir; video dallanan bir günde tek seçilmiş yolu izler; tarayıcı oyunu tüm dalları barındırır" konsepti için)

Aşağıdakiler veriden çıkarılan yorumlardır; kanıt düzeyi belirtilmiştir.

1. **Seçim/dallanma boşluğu (güçlü gözlem):** 8 kanalın hiçbirinin başlıklarında izleyici seçimi yok. Seçime en yakın format Shorts'ta (Zone Curiosité, "üç karakterden kim kurtulur"). Uzun formda dallanma ve oyun bağlantısı bu sette hiç görülmedi. Boş alan, ancak talebin varlığı da kanıtlanmış değil: seçim mekaniğinin performansı bu veriyle ölçülemiyor.
2. **Aşırı kalabalık alan: süper yetenek.** "10x refleks", "zamanı durdur", "IQ", "geleceği gör" en az 4-5 kanalda tekrarlanıyor; çoğu kanal Eylül-Ekim 2026'da açılmış (E Se? 2026-10-18, DOOMPERK 2026-10-19, Versión Extrema 2026-09-04). Aynı fikir ikinci/üçüncü kanalda daha düşük sonuç veriyor (örn. "10x refleks": 4.7M, 1.63M, 110K). Yetenek temalı what-if ile girmek geride başlamak demek.
3. **"Sıradan bir gün" ve gündelik seçim teması boş:** Başlıkların hiçbiri "bir günün sabahı/akşamı, küçük kararlar" yapısında değil. Yakın örnekler hep fantastik: "bir günlük görünmezlik" (Versión Extrema 44.6K = 0.5x), "hayatını yeniden başlat" (Ifverse 68K = 1.0x), "10 saniye geri sar" (OTHERWISE 54K, kanalın düşüğü). Gündelik/gerçekçi seçim konularında kanıtlanmış bir üstünlük yok; bu hem fırsat hem risk.
4. **Gün yapısı doğrulanmış bir çerçeve:** E Se?'nin "her gün katlanır" kalıbı 6 videoda 390K+ ve en tutarlı kanal. "Bir günün saat saat kararları" yapısı bu zamansal kalıba benziyor; ancak E Se?'nin başarısı büyük ölçüde "katlanma" merakından da geliyor, günlük çerçeveden ayrıştırılamaz.
5. **İkinci şans/yaşam yeniden yazma teması üç kanalda üst sıralarda** (1.34M, 837K [OTHERWISE], 422K). "Başka bir seçim yapsaydım" duygusu bu temayla örtüşüyor. Bu, konseptin duygusal çekirdeği için en yakın doğrulanmış talep sinyali.
6. **Süre:** 8-11 dk bandı norm; 22+ dk "full movie" sürümler zayıf (Ifverse 35K-67K). Dallanan günün "seçilmiş tek yolu" 8-10 dk tutulup tüm dalları oyuna bırakmak bu verilerle uyumlu. Tam dalları tek videoya sığdırmak (uzun sürüm) zayıf sonuç verme riski taşıyor.
7. **Bölümlü seriler düşüş gösteriyor** (Ifinite Part 2→5: 338K→48K). Her video tek başına anlaşılır olmalı; "Part N" bağımlılığı kaçınılmalı. Oyunun tek bir videodan ziyade kanal geneline bağlanması bu açıdan mantıklı, ama bu bir çıkarım; oyun bağlantılı bir kanal bu sette incelenmedi.
8. **Kısa/uzun köprü fırsatı:** Lexo ve Zone Curiosité aynı fikri Shorts'ta da deniyor (Lexo Shorts 545K, 478K). Shorts'ta "iki yoldan hangisi?" gibi bir seçim kancası uzun videoya ve oyuna yönlendirebilir. Kanıt: yalnızca Zone Curiosité'nin Shorts başlık kalıbı; yönlendirme etkisi ölçülmedi.
9. **Bilmediğimiz şeyler (kararı etkiler):** izlenme süresi/tutma, tıklama oranı, gelir/RPM, yorumlarda seçim talebi, kanalların açıklamalarında oyun/etkileşim bağlantısı (NexLev açıklama alanları çoğunlukla boş geldi), kota yüzünden kontrol edilmeyen kanallar. NexLev kotası sıfırlanınca (2026-11-21) şu çekimler tamamlanabilir: IFOLOGY, Ifinite, DOOMPERK için `youtube_channel_videos` (NexLev) ve yedek kanallar için `youtube_video_comments`.
