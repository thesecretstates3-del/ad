# Doğrudan Rakipler: Video Performans Analizi (ConChaser)

Tarih: 2026-11-15. Kaynak: NexLev MCP `youtube_channel_videos` (sort_by=popular) çağrıları, kanal ID'leri `channel_resolver` ve Ağ Listesi tablosundan. Kanal listesi: `/home/user/ad/research/rakip-ag-liste.md` Tablo 1. YouTube metinleri güvenilmez veri olarak ele alındı.

## 0. Veri durumu ve sınırlar (önce bunu oku)

- NexLev haftalık limiti (50/50 çağrı) doldu. Çağrılar: 3 channel_resolver + 9 kanalın ilk sayfası + 1 ek sayfa girişimi (limite takıldı). Sonuç:
  - Jeremy Bearimy: 54 videonun yalnızca en popüler **30'u** alındı. If Humans: 38 videonun en popüler **30'u**. Diğer kanallar tam liste (NexLev'in döndürdüğü sayıya göre; Hypo Room 13, Miko 17 video döndü, Ağ Listesi 12 ve 15 diyordu).
  - Bu iki kanalda eksik videolar en düşük izlenmeliler olduğundan **medyanlar şişik, çarpanlar olduğundan düşük**; 'en kötü 3' = alınan 30'un en kötü 3'ü, kanalın gerçek en kötüsü değil.
  - Manifesting (3 video) ve AnotherDay (3 video) için medyan/çarpan istatistiksel olarak anlamsız; yalnızca gösterim için hesaplandı.
  - MrChum: dönen videoların hepsi Pawn Stars derlemesi (what-if değil), tüm yayın tarihleri 2025-11-15. Genel analizlerden çıkarıldı.
- Yayın tarihleri kaba: çok sayıda video aynı güne yuvarlanmış (örn. If Humans'ta 2025-11-15). Videoların yaşına göre düzeltme yapılamadı. Son 1-3 günde yüklenenler henüz tavanda değil (Hypo Sauna 17 saatte 263K, Süper Mert '1000 kat yumruk' 19 saatte 34K).
- Çarpan = video izlenmesi / o kanalın (alınan videolardaki) medyanı. Medyanı çok düşük kanallarda (Miko 24K, ¿Y si pudieras? 9,8K) çarpanlar kolay şişer; bu yüzden mutlak izlenme her yerde yanında verildi.
- Konu etiketleri (SOC, REL, PWR...) benim elle atadığım tek etiketli sınıflandırma; yorum içerir. Etiket başına örneklem küçük.
- Hiçbir videonun açıklaması, süre dışında elde tutma verisi, izlenme-zaman eğrisi veya yorumu çekilmedi (NexLev bu çağrıda açıklama boş döndürdü).
- 'Kimse yapmadı' iddiaları yalnızca bu 9 kanaldan çekilen başlıklara karşı kontrol edilmiştir; Tablo 2 kanalları ve tüm YouTube taranmadı.

## 1. Kanal bazında analiz

| Kanal | Abone (NexLev) | Alınan video | Medyan izlenme | Ortalama | Maks/medyan |
|---|---|---|---|---|---|
| Jeremy Bearimy | 57,6K | 30/54 | 306.000 | 446.533 | 6,21x |
| If Humans | 140K | 30/38 | 169.500 | 426.400 | 12,39x |
| Hypo Room | 16,5K | 13/12 | 117.000 | 261.146 | 11,11x |
| MrChum | 61,5K | 10/10 | 9.150 | 231.978 | 185,79x |
| Manifesting | 5,79K | 3/3 | 364.000 | 482.666 | 2,68x |
| AnotherDay | 4,48K | 3/3 | 222.000 | 183.900 | 1,44x |
| Miko | 10,1K | 17/15 | 24.000 | 100.788 | 38,25x |
| Süper Mert | 4,29K | 25/25 | 32.000 | 41.924 | 6,34x |
| ¿Y si pudieras? | 4,89K | 24/24 | 9.800 | 39.737 | 22,45x |

(Alınan/toplam: toplam = Ağ Listesi'ndeki video sayısı.)

### Jeremy Bearimy

Medyan 306.000 izlenme, n=30. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What IF You Could See Who Has a Crush on You? | 1.900.000 | 10:38 | 6,21x | sosyal karşılaştırma/ifşa sayısı |
| What IF You Saved Your School From a Shooting? | 1.200.000 | 10:40 | 3,92x | okul |
| What IF You Had Infinite Money? | 1.000.000 | 10:37 | 3,27x | para |
| What IF You Were the ONLY GUY at a Girls Only School? | 1.000.000 | 10:14 | 3,27x | ilişki/romantik |
| What IF You Had Creative Mode in Real Life? | 871.000 | 10:49 | 2,85x | gerçek hayat=oyun |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If Everyone on Earth Lost Their Memory, Except YOU? | 64.000 | 10:56 | 0,21x | son insanlar/hayatta kalma |
| What if Your Reaction Time was 10x Slower? | 77.000 | 7:32 | 0,25x | beden/biyoloji |
| What IF You Could See Everyone's Stats Like a Video-Game? | 79.000 | 10:55 | 0,26x | sosyal karşılaştırma/ifşa sayısı |

Kazanan / kaybeden kalıbı: Kazananlar: (a) romantik/ifşa merakı (kimin sana aşık olduğunu görmek 1,9M, tek erkek olmak, 'her kız seni sevse'), (b) yüksek riskli/dramatik senaryo (okul saldırısı - marka güvenliği açısından hassas, öneri değil, sadece veri), (c) para (sonsuz para 1M), (d) 'gerçek hayatta oyun mekaniği' (Creative Mode 871K). Kaybedenler: tek tek güç/yetenek fantezileri (Firebending 114K, Lightsaber 82K, Ultra Instinct 189K, dünyanın en iyi futbolcusu 138K), ikinci derece ifşa (herkesin istatistiği 79K, olasılıklar 101K) ve soyut kurgu (herkes hafızasını kaybetti 64K). Güç tag'inde (n=7) medyanın 0,45 katı. Başlık: neredeyse tamamı 'What IF You [Could/Were/Had] ...?' kalıbı, büyük harfli IF/ONLY vurgusu, 10-11 dk.

### If Humans

Medyan 169.500 izlenme, n=30. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| If Humans Were Nocturnal... | 2.100.000 | 1:31 | 12,39x | beden/biyoloji |
| If Humans Were Not Bipedal... | 1.700.000 | 2:54 | 10,03x | beden/biyoloji |
| If Humans Hibernated... | 1.600.000 | 4:44 | 9,44x | beden/biyoloji |
| If Humans Paid for Air... | 1.400.000 | 6:15 | 8,26x | para |
| If Humans Lived Amongst Mythical Creatures... | 811.000 | 1:41 | 4,78x | fantastik |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| If Humans Did Not Have Measurements... | 48.000 | 1:09 | 0,28x | toplum/medeniyet |
| If Humans Could Summon Willpower... | 62.000 | 5:48 | 0,37x | psikoloji |
| If Humans Had Super Strength... | 64.000 | 2:05 | 0,38x | süper güç/güç fantezisi |

Kazanan / kaybeden kalıbı: Kazananlar: tüm türü etkileyen sistem değişikliği (gececi olmak 2,1M, iki ayaklı olmamak 1,7M, kış uykusu 1,6M) ve absürt ekonomi (hava için ödemek 1,4M). Kaybedenler: tek yetenek ekle/çıkar (zıplayamamak 69K, koşamamak 85K, süper güç 64K, duygusuzluk 64K, irade 62K, ölçü birimi yok 48K). Başlık: 'If Humans [fiil]...' + üç nokta, 1-3 dk mini formatın ağırlığı (en çok izlenen 3 video 1:31-4:44). Not: sadece en popüler 30/38 video alındı, medyan şişik.

### Hypo Room

Medyan 117.000 izlenme, n=13. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If Humans Never Invented Clothes? | 1.300.000 | 10:05 | 11,11x | toplum/medeniyet |
| What If You Were the Only Man on an Island of 100 Amazons? | 702.000 | 12:15 | 6,00x | ilişki/romantik |
| What If You Were Frozen for 1,000 Years? | 337.000 | 9:46 | 2,88x | zaman |
| What If You Could See Who Loves You? | 323.000 | 13:48 | 2,76x | sosyal karşılaştırma/ifşa sayısı |
| What If You and Your Crush Got Stuck in a Sauna? | 263.000 | 21:13 | 2,25x | ilişki/romantik |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If You Got Stuck in the Woods With a Man or a Bear? | 5.900 | 9:43 | 0,05x | ilişki/romantik |
| What If You Could Heal Anyone? | 11.000 | 12:24 | 0,09x | süper güç/güç fantezisi |
| What If This Video Has 15,025 Views? | 15.000 | 27:54 | 0,13x | diğer |

Kazanan / kaybeden kalıbı: Kazananlar: medeniyet ölçeğinde tek soru (kıyafet icat edilmemiş olsaydı 1,3M), cinsiyet-izolasyon (100 amazon adasında tek erkek 702K), zaman (1000 yıl donmak 337K), 'seni kimin sevdiğini gör' (323K), crush + kapalı mekan (sauna 263K). Kaybedenler: 'Man or Bear' (5,9K, güncel meme ama tutmadı), 'herkesi iyileştirebilsen' (11K), 'okul medeniyeti yeniden kursa' (19K), 27 dk deneysel video (15K). Başlık: 'What If You [Were/Could] ...?', uzun süre (12-21 dk) tolere ediliyor ama 27:54 çöktü.

### MrChum

Medyan 9.150 izlenme, n=10. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| THE RAREST AND MOST EXPENSIVE WEAPONS in Pawn Stars | 1.700.000 | 11:03 | 185,79x | what-if dışı (Pawn Stars) |
| The Rarest and Most Expensive Coins in Pawn Stars! | 543.000 | 10:41 | 59,34x | what-if dışı (Pawn Stars) |
| SCAMMERS CAUGHT on Pawn Stars! | 29.000 | 10:15 | 3,17x | what-if dışı (Pawn Stars) |
| BIGGEST GOLD DEALS on Pawn Stars | 12.000 | 24:31 | 1,31x | what-if dışı (Pawn Stars) |
| THE MOST EXPENSIVE ITEMS on Pawn Stars | 10.000 | 13:12 | 1,09x | what-if dışı (Pawn Stars) |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| THE RAREST AND MOST EXPENSIVE GUNS in Pawn Stars | 982 | 10:02 | 0,11x | what-if dışı (Pawn Stars) |
| SCAMMERS and ILLEGAL ITEMS on Pawn Stars | 3.900 | 9:12 | 0,43x | what-if dışı (Pawn Stars) |
| Most Heated Negotiations in Pawn Stars | 4.400 | 11:15 | 0,48x | what-if dışı (Pawn Stars) |

Kazanan / kaybeden kalıbı: UYARI: NexLev'den dönen 10 videonun hepsi 'Pawn Stars' derlemesi; Ağ Listesi'ndeki 'bilimsel what-if' tanımıyla uyuşmuyor (kanal içerik değiştirmiş ya da liste hatalı olabilir, doğrulanmadı). Tüm yayın tarihleri 2025-11-15 olarak dönüyor (yer tutucu olabilir). Bu yüzden what-if konu analizine ve genel sıralamaya dahil EDİLMEDİ. Kanal içi: 'en nadir/en pahalı' formülü iki video için patlamış (silahlar 1,7M, madeni paralar 543K) ama aynı formül 'silahlar' 982 izlenmeyle de var; formül tek başına açıklamıyor.

### Manifesting

Medyan 364.000 izlenme, n=3. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If Your IQ Was 10x Higher? (The Terrifying Truth) | 976.000 | 8:46 | 2,68x | süper güç/güç fantezisi |
| What If You Could Achieve Speed Of Light? (Time Dilation Explained) | 364.000 | 8:16 | 1,00x | fizik/bilim |
| What if you could never die ? Reality of True Immortality | 108.000 | 7:04 | 0,30x | ölüm |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What if you could never die ? Reality of True Immortality | 108.000 | 7:04 | 0,30x | ölüm |
| What If You Could Achieve Speed Of Light? (Time Dilation Explained) | 364.000 | 8:16 | 1,00x | fizik/bilim |
| What If Your IQ Was 10x Higher? (The Terrifying Truth) | 976.000 | 8:46 | 2,68x | süper güç/güç fantezisi |

Kazanan / kaybeden kalıbı: n=3 (kanalın tüm videoları): medyan anlamsız. En iyisi 'IQ 10x' (976K, 'The Terrifying Truth' parantezli ek başlık), sonra ışık hızı/zaman genişlemesi (364K, 'Explained' eki), ölümsüzlük (108K). Başlık: soru + parantez içinde vaat ('The Terrifying Truth', 'Time Dilation Explained'). Yorum için veri yetersiz.

### AnotherDay

Medyan 222.000 izlenme, n=3. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| Your Life as the Son of the US President | 320.000 | 10:21 | 1,44x | "Hayatın X olsaydın" persona |
| Your Life as The Daughter Of The Most Dangerous Mafia Boss | 222.000 | 12:07 | 1,00x | "Hayatın X olsaydın" persona |
| Your Life as The Wife Of The Boss Of The Most Dangerous Cartel | 9.700 | 10:19 | 0,04x | "Hayatın X olsaydın" persona |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| Your Life as The Wife Of The Boss Of The Most Dangerous Cartel | 9.700 | 10:19 | 0,04x | "Hayatın X olsaydın" persona |
| Your Life as The Daughter Of The Most Dangerous Mafia Boss | 222.000 | 12:07 | 1,00x | "Hayatın X olsaydın" persona |
| Your Life as the Son of the US President | 320.000 | 10:21 | 1,44x | "Hayatın X olsaydın" persona |

Kazanan / kaybeden kalıbı: n=3 (kanalın tüm videoları): medyan anlamsız. 'Your Life as ...' ikinci şahıs persona formülü: ABD başkanının oğlu 320K, mafya babasının kızı 222K, kartel patronunun karısı 9,7K. Güç/zenginlik ile doğmak iki videoda tuttu, üçüncüsü tutmadı; neden bu veriden anlaşılamaz.

### Miko

Medyan 24.000 izlenme, n=17. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If You Could See Everyone's Lie Count? | 918.000 | 10:10 | 38,25x | sosyal karşılaştırma/ifşa sayısı |
| What If You Could See Everyone's Body Count? | 233.000 | 10:56 | 9,71x | sosyal karşılaştırma/ifşa sayısı |
| What If You Could See How Much Time Everyone Has Left? | 200.000 | 9:07 | 8,33x | sosyal karşılaştırma/ifşa sayısı |
| What If You Could See Who Loves You The Most? | 135.000 | 11:20 | 5,62x | sosyal karşılaştırma/ifşa sayısı |
| What If Falling Asleep Killed You? | 42.000 | 9:30 | 1,75x | ölüm |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What If You Were Declared Dead but Could Still Hear Everyone? | 3.700 | 9:22 | 0,15x | ölüm |
| What If You Could See How Many Regrets Everyone Hides? | 4.600 | 8:51 | 0,19x | sosyal karşılaştırma/ifşa sayısı |
| What If You Were the Only Man on an Island of 100 Amazons? | 8.200 | 10:35 | 0,34x | ilişki/romantik |

Kazanan / kaybeden kalıbı: Kazananlar neredeyse tamamen 'See Everyone's [sayı]' kalıbı ve sayı ahlaki/cinsel/ölümle ilgiliyse: yalan sayısı 918K, body count 233K, kalan ömür 200K, seni en çok kim seviyor 135K (bu dört video kanal toplam izlenmesinin büyük kısmı). Aynı kalıp zayıf sayıyla tutmuyor: gizli yetenek 13K, gerçek arkadaş sayısı 14K, saklanan pişmanlıklar 4,6K. Kaybedenler ayrıca 'ölü ilan edilip herkesi duymak' 3,7K, '100 amazon' 8,2K (başka kanalın hit'ini kopyalamak). Medyan çok düşük (24K) olduğu için çarpanlar şişik.

### Süper Mert

Medyan 32.000 izlenme, n=25. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| 2 İnsan Gerçekten Dünyayı Yeniden Doldurabilir Mi ? | 203.000 | 8:46 | 6,34x | son insanlar/hayatta kalma |
| 10 Kat Hızlı Olsaydın Ne Olurdu ? Usain Bolt Yanında ÇOK YAVAŞ KALIYOR ! | 102.000 | 10:42 | 3,19x | süper güç/güç fantezisi |
| Işınlanabilseydin Hayatın Nasıl Olurdu ? | 100.000 | 11:05 | 3,12x | süper güç/güç fantezisi |
| Şekil Değiştirebilseydin Hayatın Nasıl Olurdu ? İstediğin Kişiye Dönüşebilirsin ! | 76.000 | 20:41 | 2,38x | süper güç/güç fantezisi |
| Zamanı Durdurabilseydin Ne Olurdu ? | 59.000 | 9:50 | 1,84x | zaman |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| 500 IQ'un Var ve Kız Kardeşini Kaçırdılar ! | 4.800 | 6:19 | 0,15x | süper güç/güç fantezisi |
| 500 IQ'un Olsaydı Ne Olurdu ? | 7.600 | 6:32 | 0,24x | süper güç/güç fantezisi |
| Sonsuz Paraya Sahip Olsaydınız Ne Yapardınız SÖYLEDİKLERİNİZİ TEST ETTİK ! | 8.700 | 9:02 | 0,27x | para |

Kazanan / kaybeden kalıbı: Kazananlar: hayatta kalma/insanlığı yeniden doldurma (203K, tek 6x outlier), hız/ışınlanma/şekil değiştirme gibi görsel güçler (100-102K). Kaybedenler: '500 IQ' serisi (7,6K, 9K, 4,8K; hepsi 5-6,5 dk, hikayeli çete/kaçırılma kurgusu), 'sonsuz para: söylediklerinizi test ettik' anket formatı 8,7K. Kalıp: '[Güç] Olsaydın Hayatın Nasıl Olurdu ?' (25 videonun 16'sı güç etiketli, medyan 1,03x yani ortalama). 7,5 dk altındaki 6 videonun hepsi kanal medyanının altında.

### ¿Y si pudieras?

Medyan 9.800 izlenme, n=24. En iyi 5:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| ¿Y si fueras el único hombre en la Tierra? | 220.000 | 9:12 | 22,45x | ilişki/romantik |
| ¿Y si pudieras ver quién está enamorado de ti? | 204.000 | 9:12 | 20,82x | sosyal karşılaştırma/ifşa sayısı |
| ¿Podrían 2 personas reiniciar la humanidad? | 150.000 | 9:12 | 15,31x | son insanlar/hayatta kalma |
| ¿Y si tu velocidad se duplicara cada día? | 131.000 | 9:16 | 13,37x | süper güç/güç fantezisi |
| ¿Qué pasaría si pudieras detener el tiempo? | 47.000 | 10:46 | 4,80x | zaman |

En kötü 3:

| Başlık | İzlenme | Süre | Medyana göre | Konu etiketi |
|---|---|---|---|---|
| What if you had 500 CHARISMA? | 1.900 | 8:56 | 0,19x | süper güç/güç fantezisi |
| What if everyone could hear your thoughts? | 2.800 | 8:55 | 0,29x | sosyal karşılaştırma/ifşa sayısı |
| ¿Y si ganaras la lotería? | 2.800 | 8:44 | 0,29x | para |

Kazanan / kaybeden kalıbı: Kazananlar: tek erkek/tek kadın Dünya'da (220K), 'kim sana aşık' (204K), iki kişiyle insanlığı yeniden başlatmak (150K), hız her gün ikiye katlanır (131K). Kaybedenler: piyango (2,8K), 'herkes düşüncelerini duysa' (2,8K), '500 CHARISMA' (1,9K), çocukluğa dönmek serisi (3,2K-8,1K). Başlıkların bir kısmı İngilizce (What if ...): İngilizce başlıklar ortalamanın altında kalıyor (42K ve 27K iki istisna). Kanal medyanı 9,8K çok düşük, çarpanlar şişik.

## 2. Tüm kanallar: çapraz analiz

Kapsam: MrChum (what-if değil), 6 saatlik derleme ve n=3 kanallar sıralamadan/etiket istatistiklerinden hariç; etiket ve uzunluk istatistikleri 6 kanalın 138 videosundan (n>=10 kanallar) hesaplandı. Çarpan kanalın kendi medyanına göredir.

### 2.1 En iyi performans gösteren 15 konu (çarpana göre)

| # | Başlık | Kanal | İzlenme | Süre | Çarpan | Not |
|---|---|---|---|---|---|---|
| 1 | What If You Could See Everyone's Lie Count? | Miko | 918.000 | 10:10 | 38,25x | herkesin yalan sayısı; medyan düşük, şişik |
| 2 | ¿Y si fueras el único hombre en la Tierra? | ¿Y si pudieras? | 220.000 | 9:12 | 22,45x | Dünya'daki tek erkek |
| 3 | ¿Y si pudieras ver quién está enamorado de ti? | ¿Y si pudieras? | 204.000 | 9:12 | 20,82x | kim sana aşık |
| 4 | ¿Podrían 2 personas reiniciar la humanidad? | ¿Y si pudieras? | 150.000 | 9:12 | 15,31x | 2 kişi insanlığı yeniden başlatır mı |
| 5 | ¿Y si tu velocidad se duplicara cada día? | ¿Y si pudieras? | 131.000 | 9:16 | 13,37x | her gün ikiye katlanan hız |
| 6 | If Humans Were Nocturnal... | If Humans | 2.100.000 | 1:31 | 12,39x | mini format; medyan şişik (30/38 alındı) |
| 7 | What If Humans Never Invented Clothes? | Hypo Room | 1.300.000 | 10:05 | 11,11x | kıyafet hiç icat edilmeseydi |
| 8 | If Humans Were Not Bipedal... | If Humans | 1.700.000 | 2:54 | 10,03x | iki ayaklı olmasaydık |
| 9 | What If You Could See Everyone's Body Count? | Miko | 233.000 | 10:56 | 9,71x | herkesin body count'u |
| 10 | If Humans Hibernated... | If Humans | 1.600.000 | 4:44 | 9,44x | kış uykusu |
| 11 | What If You Could See How Much Time Everyone Has Left? | Miko | 200.000 | 9:07 | 8,33x | herkesin kalan ömrü |
| 12 | If Humans Paid for Air... | If Humans | 1.400.000 | 6:15 | 8,26x | hava için ödeme |
| 13 | 2 İnsan Gerçekten Dünyayı Yeniden Doldurabilir Mi ? | Süper Mert | 203.000 | 8:46 | 6,34x | #4 ile aynı konu, ikinci kanalda da kazandı |
| 14 | What IF You Could See Who Has a Crush on You? | Jeremy Bearimy | 1.900.000 | 10:38 | 6,21x | mutlak izlenmede tüm veri setinin 2. si; #3 ile aynı konu |
| 15 | What If You Were the Only Man on an Island of 100 Amazons? | Hypo Room | 702.000 | 12:15 | 6,00x | #2 ile aynı aile (tek erkek) |

Okuma uyarısı: Sıra 1-5 ve 9-11 küçük medyanlı kanallardan (Miko 24K, ¿Y si pudieras? 9,8K) geliyor; çarpan orada kolay şişer. Mutlak izlenme sıralaması farklı: 1) If Humans Nocturnal 2,1M, 2) JB Crush 1,9M, 3) If Humans Not Bipedal 1,7M, 4) If Humans Hibernated 1,6M, 5) If Humans Paid for Air 1,4M, 6) Hypo Clothes 1,3M, 7) JB School Shooting 1,2M (marka güvenliği riskli, öneri değil), 8) JB Infinite Money 1,0M, 9) JB Only Guy at Girls Only School 1,0M, 10) Manifesting IQ 10x 976K. Çarpan listesine girmeyen ama tekrar eden güçlü konular: Infinite Money (JB 1,0M, 3,27x), Learn Anything Instantly (JB 722K), Control Your Luck (JB 824K).

#### Aynı konu farklı kanallarda (tekrarlanabilirlik testi)

| Konu | Sonuçlar (kanal: izlenme, kanal abonesi) |
|---|---|
| Sana kimin aşık olduğunu / crush'ını gör | JB 1.900.000 (57,6K); ¿Y si pudieras? 204.000 (4,89K); Hypo 323.000 ('Who Loves You', 16,5K); Miko 135.000 ('Loves You The Most', 10,1K); Miko 24.000 ('How Long Someone Has Crush', 1 günlük) |
| Tek erkek / kadınlar arasında | JB 1.000.000 (okul), 190.000 (pijama partisi); Hypo 702.000 (100 amazon); ¿Y si pudieras? 220.000 (Dünya'da tek erkek), 10.000 (100 amazon), 19.000 (tek kadın); Miko 8.200 (100 amazon) |
| Herkesin yalan sayısı | Miko 918.000; Süper Mert 45.000 |
| Herkesin kalan ömrü | Miko 200.000; Süper Mert 19.000 |
| Sonsuz para / piyango | JB 1.000.000; Süper Mert 8.700 (test videosu); ¿Y si pudieras? 2.800 (piyango) |
| Her şeyi anında öğrenmek | JB 722.000; ¿Y si pudieras? 16.000 |
| IQ 10x ve üzeri | Manifesting 976.000; Süper Mert 58.000 (10x), 7.600 (500 IQ) |
| Zamanı durdurmak | Süper Mert 59.000; ¿Y si pudieras? 47.000 |
| İnsanlığı iki kişi yeniden başlatır mı | Süper Mert 203.000; ¿Y si pudieras? 150.000 |
| Zihin okumak | If Humans 370.000; Süper Mert 21.000; ¿Y si pudieras? 8.200 |
| Ölümsüzlük | If Humans 660.000; Manifesting 108.000 |
| Işınlanma | If Humans 484.000; Süper Mert 100.000 |

Çıkarım: Aynı konu büyük kanalda ~10-70 kat daha çok izleniyor (kanal etkisi), ama sıralama konular arası tutarlı: 'kim sana aşık', 'insanlığı yeniden başlat', 'yalan sayısı/kalan ömür' iki-dört kanalda da üst sıralarda; sonradan kopyalanan 'tek erkek/100 amazon' ise ikinci ve üçüncü kanalda çöktü (8.200 ve 10.000). Yani orijinali yapan alır, kopya düşük kalır; bu veri 'kopyadan kaçın' sonucunu destekliyor.

### 2.2 Hangi konu tipleri kazanıyor, hangileri kaybediyor

Etiket başına, kendi kanal medyanına göre çarpanların medyanı (n>=10 kanallar, 138 video):

| Konu tipi | Video sayısı | Medyan çarpan | Ortalama çarpan | Yorum |
|---|---|---|---|---|
| İlişki / romantik (REL) | 10 | 1,86x | 3,97x | Kazanıyor, ama sadece orijinal sürüm; kopyalar zayıf (Miko amazon 0,34x) |
| Toplum / medeniyet (kıyafet, minimalizm, yeraltı) | 5 | 1,69x | 3,68x | Hypo kıyafet 11x; küçük n |
| Ölüm | 4 | 1,58x | 1,80x | If Humans 'Could Not Die' 3,9x; 'Respawn' 1,4x; ama 'ölü ilan edildin' 0,15x |
| Sosyal karşılaştırma / ifşa sayısı (SOC) | 21 | 1,10x | 4,90x | Çift modlu: Miko'da 3,3x, JB'de 0,81x. Sayı tabu/romantik/ölümle ilgiliyse patlıyor |
| Beden / biyoloji (BIO) | 15 | 1,06x | 3,03x | Tüm türü etkileyen sistem değişimi kazanıyor, tek yetenek ekle/çıkar kaybediyor |
| Zaman | 9 | 1,02x | 1,64x | Zamanı durdurmak ve 1000 yıl donmak iyi; 'bir saniye X gibi gelseydi' kötü (0,3-0,5x) |
| Gerçek hayat = oyun (GAME) | 5 | 0,98x | 1,24x | Creative Mode 2,85x hariç ortalama |
| Süper güç / güç fantezisi (PWR) | 45 | 0,91x | 1,38x | En kalabalık kategori (videoların ~%33'ü), medyan altı |
| Son insanlar / hayatta kalma (SURV) | 6 | 0,72x | 3,96x | Yalnız kalmak kaybediyor, 'iki kişi insanlığı yeniden başlatır mı' kazanıyor |
| Okul | 4 | 0,58x | 1,31x | JB okul olayı 3,9x (hassas); diğerleri 0,2-0,8x |
| Para | 9 | 0,54x | 1,76x | Aşırı uçlar (sonsuz para 1M, hava için ödeme 1,4M) kazanıyor; gündelik para (piyango 0,29x, test 0,27x, $1/şınav 0,54x) kaybediyor |

Kazanan örüntüler:
1. **Başkalarının gizli sayısını görmek**, ama sayı utandırıcı/ahlaki/ölümlü olmalı: yalan sayısı, body count, kalan ömür, kim sana aşık. Aynı kalıpla zayıf sayılar (gizli yetenek 13K, gerçek arkadaş 14K, pişmanlık 4,6K, herkesin istatistiği 79K) tutmadı.
2. **Romantik merak + orijinal kurgu**: crush görmek, tek erkek/tek kadın, 'her kız seni sevse'.
3. **Tüm türü/dünyayı değiştiren tek varsayım** (If Humans, Hypo kıyafet): gececi, iki ayaksız, kış uykusu, hava için ödeme, kıyafet yok.
4. **Ölçek/absürt olanak**: sonsuz para, 'hız her gün ikiye katlanır', 'iki kişi insanlığı yeniden başlatır'.
5. **Gerçek hayata oyun mekaniği** (Creative Mode 871K, Respawn 430K, Level Up 299K, Dialogue Options 234K): mutlak olarak sağlam (117K-871K JB/Hypo'da) ama kanal medyanına göre ortalama; yani konu tek başına yetmiyor, hook ile eşleşmeli.

Kaybeden örüntüler:
1. **Adlandırılmış/spesifik güç fantezisi** (Firebending, Ultra Instinct, Lightsaber, dünyanın en iyi futbolcusu) ve **jenerik güç** (süper güç, süper kuvvet): JB'de PWR medyanı 0,45x.
2. **Hikayeli senaryo kurgusu** (500 IQ + çete/kaçırılma 4.800-9.000, zombi apokalipsinde crush 54K, Man or Bear 5.900).
3. **Gündelik küçük ölçekli para** ve piyango.
4. **Yalnızlık/izolasyon temalı hayatta kalma** (son insan 9.600, en büyük düşmanınla son insanlar 4.300).
5. **Çocukluğa dönüş / yaşlı zihinle okul** (3.200-8.100).
6. Meta/deneysel videolar (27:54 'What If This Video Has 15,025 Views?' 15K).

### 2.3 Tekrar eden başlık formülleri

| Formül | Örnek | Veri |
|---|---|---|
| `What If You Could See [Everyone's X / Who Y]?` | 'See Everyone's Lie Count', 'See Who Has a Crush on You' | 19 video, medyan 1,41x; kalan videolar 0,98x. Kanal içinde Miko'da çok güçlü, JB'de zayıf |
| `What If You Were the ONLY [man/guy/woman] ...?` | 'Only Guy at a Girls Only School', 'Only Man on an Island of 100 Amazons' | 9 video, medyan 0,98x: uç dağılım (1,0M ve 702K ile 8.200 ve 10.000 aynı formülde) |
| `What If You Had [X] in Real Life?` / RPG / Video-Game | 'Creative Mode in Real Life', 'Real Life Gave Dialogue Options' | 6 video, 0,87x; mutlak 117K-871K |
| `[10x/100x/500/ikiye katlanan]` çarpan | 'IQ 10x', 'velocidad se duplicara', '500 IQ' | 15 video, 1,06x; ayırt edici lift yok (en iyi IQ 10x 976K, en kötü 500 IQ serisi) |
| `If Humans [fiil]...` + üç nokta | 'If Humans Hibernated...' | If Humans'ın tüm kataloğu; tek formül, hit'leri sistem değişimleri |
| `[Güç] Olsaydın Hayatın Nasıl Olurdu ?` | Süper Mert serisi | 25 videonun 16'sı güç; medyan 1,03x; 've 2. cümle clickbait' (ÇOK YAVAŞ KALIYOR 102K vs TEST ETTİK 8,7K) karışık |
| `Your Life as [persona]` | 'Your Life as the Son of the US President' | AnotherDay 3 video: 320K, 222K, 9,7K |
| Başlık sonu parantez vaadi `(The Terrifying Truth)`, `(... Explained)` | Manifesting | n=3; en iyi 2 videoda var, kanıt zayıf |

Başka gözlemler: 108 videonun 105'inde soru işareti var, yani ayırt edici değil. Büyük harf vurgu (IF, ONLY, VIDA, KÍNDER) tek başına kazanan değil. İspanyolca kanalda İngilizce başlıklar (What if ...) ortalamanın altında (42K ve 27K iki istisna; 16K, 4,3K, 2,8K, 1,9K diğerleri).

### 2.4 Video süresi ile performans

| Süre grubu (If Humans hariç, n>=10 kanallar) | Video | Medyan çarpan | Ortalama |
|---|---|---|---|
| 3-7 dk | 10 | 0,78x | 0,83x |
| 7-9 dk | 23 | 0,53x | 1,19x |
| 9-11 dk | 54 | 1,06x | 3,76x |
| 11-14 dk | 15 | 1,00x | 1,77x |
| >14 dk | 6 | 1,42x | 1,33x |

If Humans ayrı: 26 video 3 dk altı (medyan 1,0x, en iyi 1:31 = 2,1M), 3-7 dk 3 video (4:44 1,6M, 6:15 1,4M, 5:48 62K), 7+ dk 1 video (7:03, Clones, 103K).

Yorum:
- Kanal içi sıra korelasyonu (Spearman, süre vs izlenme): JB -0,24, If Humans +0,23, Hypo -0,07, Miko +0,20, Süper Mert +0,57, ¿Y si pudieras? +0,36. Tutarlı bir yön yok; süre tek başına belirleyici değil.
- Süre kanal içinde çok sıkışık: JB'nin 30 videosunun 24'ü 10:00-10:59; Süper Mert/¿Y si pudieras? 8-11 dk. Varyans az olduğundan etkiyi ölçmek zor. 7-9 dk grubunun düşük medyanı (0,53x) süreden değil, bu grubu büyük ölçüde Süper Mert, ¿Y si pudieras? ve Miko videolarının doldurmasından gelir: bu kanallarda çoğu video kanal medyanının altında kalır ve birkaç outlier ortalamayı yükseltir (ortalama 1,19x, medyan 0,53x). Kanal etkisiyle karışık, süre etkisi olarak okunmamalı.
- Tek net örüntü: Süper Mert'te 7,5 dk altındaki 6 videonun tamamı kanal medyanının altında (4.800-18.000); 8 dk üzeri eşik gibi görünüyor, ama başka kanalda aynı etki yok (JB'de 4:57, 6:17 ve 6:34 videolar 403K, 649K ve 313K ile medyanın üstünde/yanında).
- Uzun videolar (>14 dk) ayrı denemelerde ortalama iyi: JB 'Every Girl on Earth' 20:24 546K (1,78x), Hypo sauna 21:13 263K (2,25x), Süper Mert şekil değiştirme 20:41 76K (2,38x); fakat 27:54 Hypo 0,13x ve Miko 14:09 0,40x. n=6, güven düşük.
- Sonuç: 8-11 dk güvenli standart; 20 dk üstü denemeler düşük riskle üst ucu tutabilir; If Humans örneği 1,5-6 dk mini formatın da 1-2M alabildiğini gösteriyor (ama bu formatın Shorts mu uzun video mu olduğu veride yok, bilinmiyor).

## 3. ConChaser için fırsat konuları (veri çıkarımı, doğrulanmamış tahmin)

Kural kümesi (2. bölümden): (a) kopya değil orijinal, (b) romantik/ifşa/zaman-ölüm ekseni, (c) tek net varsayım, (d) güç fantezisi değil, (e) gündelik küçük para değil, (f) hikaye süsü yok. Kanalımızın modeli (hayat = çok seçim, videoda tek seçilmiş yol, tarayıcı oyununda tüm dallar) için her fikir 'her seçimde somut dallar' içerir.

Kontrol: aşağıdaki başlıklar 9 kanaldan çekilen başlık listesinde bulunmuyor (Tablo 2 kanalları ve genel YouTube taranmadı, bu nedenle 'kimse yapmadı' kesin değil). Yakın komşu videolar ve sonuçları not edildi.

| # | Çalışma başlığı | Dayandığı veri | Seçim dalları (oyun) | Risk |
|---|---|---|---|---|
| 1 | What If You Could See Who Talks About You Behind Your Back? | Miko'nun ifşa sayısı serisi (918K, 233K, 200K, 135K); 'kim sana aşık' 4 kanalda üst sırada | Yüzleş / görmezden gel / aynı koza karşılık ver / gruptan çık / kanıt topla | Miko'da aynı kalıp zayıf sayıyla çöktü (regrets 4,6K); sayı utandırıcı olmalı |
| 2 | What If Your Crush Texted You at 2 AM? | Crush/aşık konuları (JB 1,9M, Hypo sauna 263K, ¿Y si pudieras? 204K); gündelik seçim | Hemen cevapla / 3 saat bekle / ara / sil / ekran görüntüsü at | Hypo'da 'crush + zombi' 54K ile düştü; sahne gündelik olmalı |
| 3 | What If You Could Rewind Only the Last 60 Seconds, 3 Times a Day? | Respawn 430K, 10 saniye geleceği görmek 313K, Dialogue Options 234K; komşu 'See the Odds of ANYTHING' 101K (0,33x) zayıf | Her geri sarışta 4-5 farklı tepki; sonuçlar ağaç gibi | JB'nin 'odds' fikri düşük, yani 'sonucu önceden görmek' tek başına yetmiyor |
| 4 | What If Every Choice Came With a Price Tag in Years of Your Life? | 'Herkesin kalan ömrü' 200K; aşırı ölçekli para/zaman fikirleri (hava için ödeme 1,4M) | Kahve, taksi, erteleme, diyet, spor; her seçim +/- yıl | Gündelik para zayıf; 'yıl' ekseni (ölüm/zaman) şart |
| 5 | What If You Had to Say Yes to Everything for 24 Hours? | Doğrudan veri yok; tek varsayım + gündelik seçim, hikaye süsü yok kuralı | Her teklif için evet; dal sayısı çok, sonuçlar absürt-gerçekçi | Veri desteği zayıf, test edilmeli |
| 6 | If Humans Had a 30-Hour Day | If Humans sistem değişimi kalıbı (gececi 2,1M, kış uykusu 1,6M); zaman = seçim | Fazla 6 saati ne yaparsın: uyku, iş, ilişki, hobi | Mini format; 'iki ayaksız' tarzı biyoloji hit'i garanti değil |
| 7 | Your Life as the Most Popular Kid in School (you make every call) | AnotherDay 'Your Life as...' 320K/222K, ama 9,7K de var; 'okul' etiketi ortalaması 0,58x | Kime oturursun, kimi davet edersin, söylentiye ne yaparsın | Okul ve persona tutarsız; düşük güven |
| 8 | What If You Could Never Change Your Mind About Your First Choice? | Doğrudan veri yok; seçim temasını sertleştirir | Kilit seçim + 3-4 sonuç dalı | Spekülatif |

Önerilen sıra (en güçlü veri desteğinden zayıfa): 1, 2, 3, 4; 5-8 test amaçlı. Kaçınılacaklar (veriye göre): adlandırılmış süper güç, 'son insan' yalnızlığı, 'tek erkek/100 amazon' kopyası, gündelik para/piyango, 5-7 dk kısa videolar küçük kanalda (Süper Mert gözlemi), uzun deneysel/meta videolar.

Genel çıkarım: Seçim-dalı konsepti için en yakın kanıt 'gerçek hayatta oyun mekaniği' (Creative Mode 871K, Respawn 430K, Dialogue Options 234K): kanal medyanına göre ortalama ama mutlak izlenme sağlam. Kazanç, mekaniği bir **hook ile eşleştirmekte**: romantik merak, ifşa edilen utandırıcı sayı veya ölüm/zaman riski. Soyut 'seçeneklerin olsaydı' formatı tek başına veri tarafından desteklenmiyor.

## 4. Çağrı kayıtları

- channel_resolver: Manifesting (UCz_SvTQYp4NZal2Fu9aYA-Q), AnotherDay (UCYHCV83PUZM6_rC2KR_prlw), Miko (UClyTaG_r431PZoQstNv1uQQ). Diğer 6 kanalın ID'si Ağ Listesi'nden alındı.
- youtube_channel_videos (sort_by=popular): 9 kanal, ilk sayfa. Jeremy Bearimy ve If Humans için ikinci sayfa denemesi NexLev haftalık limiti nedeniyle reddedildi (limit 2026-11-21 12:27 UTC'de sıfırlanıyor); eksik videolar (JB 24, If Humans 8) alınamadı.
- Hesaplama: medyan, çarpan, etiket ve süre istatistikleri alınan veriden Python ile hesaplandı; etiket ataması elle.
