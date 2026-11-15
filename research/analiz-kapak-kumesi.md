# ConChaser Kapak Kümesi Analizi

Tarih: 2026-11-15
Kaynak: /home/user/ad/research/kapak-benzeri-kanallar.md (görsel benzerlik >= %80 sonuçları) + NexLev canlı çekimleri (youtube_channel_videos, popular sıralı; youtube_video_details).

## 0. Veri sınırları (önce bunları oku)

1. **Küçük resimleri göremedim.** i.ytimg.com'a bu oturumdan erişim yok (proxy 403 verdi, 8 deneme). NexLev'in döndürdüğü yalnızca küçük resim URL'leri var. Bu yüzden renk, yüz, kapak yazısı, karakter tasarımı hakkında hiçbir görsel iddia yok. Bölüm 2'deki kapak yorumları başlıktan çıkarılmış hipotezdir ve öyle işaretlidir.
2. **NexLev haftalık kota doldu (50/50, sıfırlanma 2026-11-21 12:27 UTC).** 10 kanalın popüler listesi alındı. Video detayı 7 video için alındı, 3 tanesi (KzdIyAqm15c, ncziskWQbQA, xPzwR_Y698o) kota hatası verdi. Bu üç videonun rakamı kanal listesinden geliyor, detay alanları (etiket, açıklama, beğeni) yok. channel_resolver gerekmedi, kanal ID'leri dosyadaki URL'lerden alındı.
3. **"Kanal medyanı" gerçek kanal medyanı değil.** Her kanal için popüler sıralı ilk 23-30 videonun medyanını aldım (Manifesting'de yalnızca 3 video var, medyan anlamsız). Bu örnek en çok izlenenleri kapsadığı için medyan gerçek değerden yüksektir. Gerçek kanal medyanı daha düşükse çarpanlar daha da büyür. Yani verilen çarpanlar muhafazakar alt sınır niteliğinde.
4. Videoların yaşı çok farklı (Hypothetically 8-12 aylık, diğerlerinin çoğu 1-5 haftalık). Yayın tarihleri NexLev'de çoğunlukla toplu/yuvarlak tarih (ör. 2026-11-01, 10-25) olarak geliyor. Çarpanlar kaba karşılaştırmadır.
5. YouTube metinleri (açıklamalar) veri olarak okundu, içlerinde talimat niteliğinde bir şey yoktu.

## 1. Neler elendi, neler alındı

**Elenen (tür dışı) kanallar, kapak benzerliği yüksek olsa da:**
- Roblox/oyun: Logan Roblox, Talia, CraxyAnimator, ROBLOX HOSPITAL, Historias de Roblox, Roblox Étoile, Nayvex, Jarvan Brookhaven, Robloxyusufii, Lumina_Yandere, Eskiwi, domi, Chaotic Gamer, Gatorio
- ASMR: Girlfriend ASMR Keisha
- Çocuk/IShowSpeed/challenge: SpeedToon, The Savage Square
- Yapay zekâ araç eğitimi: Higgsfield AI, Generative AI for the Beginner's Mind
- Manhwa/web roman/intikam özetleri: John's Manhwa, Mimmy Story, Sweetheart's Vengeance, 맛있는 주방
- Afrika/drama "storytime" animasyonları ve benzerleri: Von Animations, Elle Light Studios, Grace African Folktales, Mystère Afrique, Histoire Africaine de Aisha, Afro-Korean Drama Tv, AlinaaDVD, Témoignages Animés FR ve benzerleri (başlık kalıbı drama hikayesi, "what if" değil)
- İlişki/özgüven danışmanlık videoları: human sorted, Hey Dreamers, Read The Room, Atlas
- Çok küçük POV finans/zeka kanalları (tablodaki 1 isabetli, <10K izlenmeli satırların çoğu): detay çekilmedi.

**Alınan 10 kanal** (what-if / "senaryo" / rütbe-merdiven formatları; ConChaser'ın IQ, Future Wealth, Future Height, Crush temalarına en yakın):
Yemek Arası Hikayeler (tr), DOOMPERK, One Small If, Alternate You, Ifinite, Ifverse, Manifesting, Jeremy Bearimy, Hypothetically, Trace Écrite (fr).
Çekilmeyen ama relevan: IFopposite (399K'lık IQ videosu var), Universo Alterno, Mr Explica.

## 2. Kanal özet tablosu (canlı veri, 2026-11-15)

Abone, en çok izlenen video, örneklem medyanı ve çarpan. "Çarpan" = en iyi video / örneklem medyanı. "Abone katı" = en iyi video / abone.

| Kanal | Abone | n | Örneklem medyanı | En iyi video (izlenme) | Çarpan | Abone katı |
|---|---|---|---|---|---|---|
| Ifverse | 62.8K | 23 | ~68K | What If Your Reaction Time Was 10x Faster? (4.7M) | ~69x | ~75x |
| Ifinite | 18.5K | 30 | ~27K | What If You Could See How Long Everyone Has Left? (1.8M) | ~67x | ~97x |
| Alternate You | 9.44K | 23 | ~26K | What If You and Your Best Friend Lived a Googolplex Years? (803K) | ~31x | ~85x |
| One Small If | 6.5K | 26 | ~11K | What If You Doubled in Size Every Hour? (296K) | ~27x | ~46x |
| Yemek Arası Hikayeler (tr) | 3.25K | 30 | ~9.8K | Herkesin IQ Seviyesini Görebilseydin Ne Olurdu? (257K) | ~26x | ~79x |
| DOOMPERK | 13.3K | 28 | ~63K | What If You Had Infinite IQ in PRISON? (732K) | ~12x | ~55x |
| Hypothetically | 343K | 30 | ~695K | What It's Like to Be a Black Market Surgeon (6.4M) | ~9x | ~19x |
| Jeremy Bearimy | 57.6K | 30 | ~306K | What IF You Could See Who Has a Crush on You? (1.9M) | ~6x | ~33x |
| Trace Écrite (fr) | 40.2K | 30 | ~96K | Your Life at Every Rank in the DZ MAFIA (367K) | ~3.8x | ~9x |
| Manifesting | 5.79K | 3 | (anlamsız) | What If Your IQ Was 10x Higher? (976K) | n/a | ~169x |

Gözlem: en yüksek "abone katı" küçük kanallarda (Manifesting 169x, Ifinite 97x, Alternate You 85x, Yemek Arası 79x). Yani bu kümedeki patlamalar aboneden bağımsız, arama/öneri kaynaklı. Yemek Arası'nın 3.25K abonesiyle 257K'lık videosu bunun Türkçe kanıtı.

Video detayından (7 video): beğeni oranı Trace Écrite %1.58 (5,821/367,631), Ifverse %1.17, Jeremy shPeyaG3XUk %0.66, Yemek Arası %0.63, DOOMPERK %0.60, Ifinite %0.59, Alternate You %0.44. Rütbe formatı ve Ifverse'in 7 dakikalık hikayesi en yüksek beğeni oranında.

## 3. (1) Kazanan başlıkların / kapakların ortak noktaları

### Başlıktan görünenler (kesin, veri tabanlı)

1. **Tek cümlelik imkansız önerme.** Çekilen en iyi 5 başlık x 7 what-if kanalı (35 başlık) neredeyse tamamen "What If You ..." (Yemek Arası'nda "... Ne Olurdu?") kalıbında. Kanallar arası başlık örtüşmesi yüksek: "500 IQ" (Ifverse, Yemek Arası), "Kindergarten with all memories" (Ifverse, Yemek Arası, One Small If), "Saved school from shooting" (Jeremy Bearimy 1.2M, Yemek Arası 174K), "See everyone's IQ" (Yemek Arası, DOOMPERK "Everyone Could See YOUR IQ").
2. **Herkesin üstünde gizli bilgi görmek.** En büyük videoların çoğu bu mekanik: Ifinite "How Long Everyone Has Left" (1.8M), Jeremy "Who Has a Crush on You" (1.9M), DOOMPERK "How Everyone Rates You 1 to 10" (444K), Yemek Arası "Herkesin IQ'sunu görmek" (257K).
3. **Ölçülebilir niceleme / eskalasyon.** 10x, 500 IQ, "Every Hour", Googolplex, 1 to 10, "Infinite IQ". 35 başlığın yaklaşık 9'unda açık rakam var (ben saydım); rakamsız olanlarda da "infinite", "every hour", "everyone" gibi ölçek kelimesi var. Alternate You'nun 5 en iyi başlığının hepsi bir büyüklük/sayı hikayesi.
4. **Kısa başlık.** Çoğu 5-10 kelime. Jeremy Bearimy ve Ifinite "What IF" yazımıyla IF'i büyük harf yapıyor; DOOMPERK tek kelimeyi büyük harfle vurguluyor (PRISON, ISLAND, SUPERPOWER, ADMIN COMMANDS).
5. **Süre 7-11 dk.** Ifverse 7:13, Alternate You 9:14, Ifinite 10:31, Jeremy 10:38, Yemek Arası 10:00. Jeremy Bearimy'nin popüler listesindeki neredeyse her video 10-11 dk. DOOMPERK'te üst videolar 13-16 dk ama 8:52'lik de 250K aldı. Uzun "FULL MOVIE" sürümleri zayıf: Ifverse 24:22 film 67K, 21:39 film 35K (ilk bölüm 4.7M), Ifinite 20:46 film 9.4K.
6. **Anlatım biçimi (kanal metinlerinden):** Ifverse anahtar kelimeleri "stickman animation", Ifinite açıklaması "StickFigure", Alternate You "2D animation", Yemek Arası "2D animasyon". Yani kapaklarda stick/basit 2D karakter bir norm olabilir (metadata, görsel doğrulama yok).
7. **Hikaye + bilim notu + bölüm işaretleri.** Üst videoların açıklamalarında kaynaklı "science notes", bölüm başlıkları (chapters) ve sonda yoruma soru ("Would you want to see the numbers? Tell us in the comments") var (Ifverse, Ifinite, DOOMPERK, Alternate You).
8. **Küçük resim A/B ipucu (zayıf):** Ifinite/Alternate You/One Small If'te bazı yeni videoların küçük resim URL'lerinde `hq720_custom_1/2/3` ekleri var (b52iy3koFPI, b-lT-l85vJU, U_L3QfKRQp8). Bu, özel yüklenmiş küçük resim anlamına gelir; test-karşılaştırma kullanıldığına dair kanıt değil, yalnızca ipucu.

### Kapaktan görünenler

**Görülemedi.** Küçük resim dosyalarını indiremedim. Aşağıdaki kapak ifadeleri çıkarım:
- "Başın üstünde etiket" mekaniği (Ifinite timer, Jeremy crush, Yemek Arası IQ) doğası gereği görseldir; kapakta büyük bir sayı/etiket olması akla yatkın ama doğrulanmadı.
- Kümenin görsel benzerlik skoru %80+ olduğuna göre (kaynak dosya), düz arka plan + 1-2 sade karakter + büyük sayı/yazı kompozisyonu olası; doğrulanmadı.

Kota yenilenince (2026-11-21) ya da elle bakmak için: `https://i.ytimg.com/vi/<VIDEO_ID>/maxresdefault.jpg`. Öncelikli ID'ler: MroF1XmHOZw, u2GyTKhHsTQ, aV7_cA_xVXI, UgIdpJG13Gc, X_wiaDTxSho, F1KuVENxdYU, KzdIyAqm15c, ncziskWQbQA.

## 4. (2) Başlık + kapak eşleşme kalıpları

Kapak görülmediği için burada yalnızca başlık tarafı kesin; kapak tarafı "varsayım" olarak işaretli.

| Kalıp | Örnek (izlenme) | Başlık tarafı (kesin) | Kapak tarafı |
|---|---|---|---|
| Gizli etiket görme | Ifinite "How Long Everyone Has Left" (1.8M); Jeremy "Who Has a Crush on You" (1.9M) | "See ... above everyone" mekaniği, kişi/duygu odaklı | Varsayım: kafa üstü sayaç/ikon |
| Çarpan x karakter | Ifverse "10x Faster" (4.7M), Ifinite "10x BIGGER" (553K), Alternate You "10x Longer Sleep" (261K) | "10x" açık rakam | Varsayım: büyük "10x" metni |
| Absürt büyük sayı serisi | Alternate You: Googolplex 803K, Graham's 228K, Googol 148K, TREE(3) 118K, Rayo 105K | Aynı şablon, sayı değişiyor | Varsayım: aynı şablon, farklı sayı (ayrım için açılış kozu) |
| Kurum/ortam değişimi | DOOMPERK "Infinite IQ in PRISON" 732K, "in the Army" 443K, "on a Deserted ISLAND" 33K | Aynı güç + yeni ortam | Varsayım: ortam arka planı değişiyor |
| Rütbe merdiveni | Trace Écrite "Your Life at Every Rank of ..." (hepsi aynı şablon, 29K-367K), Hypothetically "Every Rank" | "Your life at every rank of X" | Varsayım: merdiven/basamak görseli |
| Tek ayrıntı sahne | Ifverse "One Second Felt Like Ten" 698K (Part 2), "Forever" 392K (Part 3) | Parça numaralı seri | - |

Net bulgular (kesin):
- **Seriler hızla sönüyor:** Ifverse Part 1 4.7M, Part 2 698K (~%15), Part 3 392K (~%8). Ifinite "timer" hikayesi: Part 1 1.8M, ardından 338K, 174K, 102K, 47K, 35K, 24K, 18K (final). Devam bölümü ilk bölümün ~%2-19'unu alıyor.
- **Aynı güç farklı kanalda tekrar çalışıyor** (Yemek Arası'nın Jeremy Bearimy ile aynı fikir örtüşmesi): fikir kanıtlı, kanal bağımsız.
- **Kendi çok küçük kanalda bile 10-30x medyan:** fikir > kanal büyüklüğü.

## 5. (3) Hangi konular en çok izleniyor (kanal medyanına çarpan)

Çarpan = video izlenmesi / o kanalın örneklem medyanı. Dikkat: yüksek çarpan küçük kanallarda (düşük medyan) şişer.

| Konu | En iyi örnekler (çarpan) | Konu içi medyan çarpan | Yorum |
|---|---|---|---|
| Herkesin üstünde gizli bilgi görmek | Ifinite zaman sayacı 1.8M (~67x), Yemek Arası IQ 257K (~26x), DOOMPERK puan 1-10 444K (~7x), Jeremy crush 1.9M (~6x); ama fear 158K (0.5x), future wealth One Small If 3.7K (0.3x) | ~1.5x | En yüksek tavan, yüksek varyans. "Ne görüyorsun" kadar "kimin için" belirleyici. |
| Zekâ / IQ | Yemek Arası 257K (26x), Ifverse 500 IQ 1.4M (~21x), DOOMPERK Prison 732K (~12x), Army 443K (~7x); zayıf: "Everyone Could See YOUR IQ" 16K (0.25x), Random IQ 13K (0.2x) | ~3.7x | Somut ortam (hapishane/ordu) kazanıyor. Soyut rakam tek başına (100x smarter 23K) zayıf. |
| Büyüme / küçülme / hız (10x, katlanan) | One Small If 296K (~27x), Ifinite 553K (~21x), Alternate You 261K (~10x), Ifverse hız 4.7M (~69x) | ~6x | Her kanalın en iyi veya ikinci en iyi videosu bu grupta. |
| Çok uzun yaşamak / absürt büyük sayı | Alternate You 803K (~31x), 228K (~9x), 148K (~6x), 118K (~4.5x), 105K (~4x) | ~4x | Seri ilerledikçe sönüyor (BIG FOOT 35K ~1.35x). |
| Ölümcül okul/şiddet senaryosu | Yemek Arası 174K (~18x), Jeremy 1.2M (~4x) | n/a | Kanal bağımsız iyi çalışıyor. Marka güvenliği/reklam riski ayrıca değerlendirilmeli. |
| Okula kaybolmuş anılarla dönmek | Ifverse 422K (~6x), Yemek Arası 14K (1.4x), One Small If 6.9K (0.6x) | - | Büyük kanalda çalışıyor, küçüklerde sıradan. |
| Kızlar/romantik | Jeremy "ONLY GUY at Girls Only School" 1.0M (~3.3x), 546K (1.8x); Yemek Arası "dokunduğun herkes" 90K (~9x); DOOMPERK 8.7K (0.14x), Ifinite 7.3K (0.27x) | ~1.2x | Çok kanal denemiş, çoğu ortalama altı. ConChaser'ın "Crush" benzerliği burada. |
| Para | Hypothetically "POV: Trillionaire" 3.1M (4.5x), Jeremy "Infinite Money" 1.0M (3.3x); küçük kanallarda 1.5K-47K (0.14-0.8x) | düşük | Büyük kanalda çalışıyor, küçüklerde zayıf. |
| Rütbe / "hayatın her kademesi" | Hypothetically Italian Mafia 3.0M (4.3x), Trace Écrite DZ Mafia 367K (3.8x) | ~1.25x (Hyp.) | Düşük varyans, istikrarlı taban (Trace Écrite'in en kötüsü 29K, en iyisi 367K). |
| Gerçek hayat = oyun (creative mode, level up, ultra instinct) | Jeremy Creative Mode 871K (2.8x), DOOMPERK Admin Commands 221K (3.5x) | ~1-3x | Orta; oyun izleyicisine yakın. |

Sonuç: kümenin tavanı yüksek, tabanı düşük. Her kanalın birkaç patlaması var, gerisi medyan civarı. "Yüksek çarpan" konular: gizli etiket, çarpan/hız, absürt sayı.

## 6. (4) Yeni bir kanal bu kümeden nasıl ayrışır, tıklama gücünü korurken

Bağlam: Oli (comic-pop 2D karakter), A/B seçim kapıları, "olası gelecekler" sayacı, dallanan hayat ağacı.

Kümenin ortak imzası: "What If You ..." tek cümle + açık rakam + sade stick/2D karakter + tek doğrusal hikaye. Rakipler birbirinin aynısı olduğu için ayrışmak kolay; tıklama gücü kaynakları (kanıtlı) şunlar: (a) tek cümlelik imkansız önerme, (b) rakam/ölçek, (c) "herkesin üstünde gizli bilgi", (d) 7-11 dk süre. Bunları koru, şunları değiştir:

1. **Başlık çerçevesini "What If You" yerine seçim çerçevesine kaydır.** Kümede neredeyse hiç görülmeyen: iki seçenekli başlık. Örnek (öneri, veri değil): "Oli'nin 2 Kapısı: Para mı, Ömür mü?" / "Oli bu seçimde 7 gelecekten hangisine düştü?" Böylece önerme + rakam korunur, kalıp kopyalanmaz.
2. **"Olası gelecekler" sayacını kümenin en güçlü mekaniğine bağla.** En yüksek tavan "herkesin üstünde gizli sayı" (Ifinite zaman sayacı, Jeremy crush, Yemek Arası IQ). Oli'nin kafasının üstünde ya da kapağın köşesinde sürekli duran "gelecek sayacı" aynı mekaniği kullanır ama sahibi sizsin. Sayaç numaralı hook'u (10x, 500, 1-10 muadili) zaten karşılar.
3. **Seri yapısını doğrusal "Part 2/3" yerine dallanma yap.** Kümede devam bölümleri %2-19'a düşüyor (Ifverse, Ifinite). Dallanan ağaçta her bölüm bir önceki seçimden bağımsız izlenebilir ve izleyici "başka yolu da gör" diyebilir (veri yok, hipotez). Ağaçta kayıp seçeneğe ayrı video = yeni giriş noktası.
4. **Rütbe merdiveni yerine ağaç.** Trace Écrite/Hypothetically merdiveni (düşük varyans, istikrarlı taban) kanıtlı; "kademe" yerine "dal" görseli aynı sıralı-kategori çekiciliğini sunar.
5. **Ortam değişimi şablonu çalışıyor (DOOMPERK: hapishane 732K, ordu 443K, ada 33K).** Aynı karar Oli için farklı kurumlarda (okul, hapishane, ordu) tekrar edilebilir; kurumsal kuralı olan ortamları tercih et.
6. **Görsel ayrışma (kapak):** kümenin tamamı sade stick/2D (metadata). Oli'nin comic-pop stili (kalın kontur, pop renk, halftone) kategoride ayırt edici olur. Bunu kesinleştirmek için önce Bölüm 3'teki 8 küçük resmi elle incelemek lazım; şu an "küme neye benziyor" bilmeden "farklı" demek spekülasyon.
7. **Kısa tut, "Full movie" yapma:** 20+ dk birleştirilmiş sürümler 35-67K'da kaldı (Ifverse), ana videolar 4.7M. Tek hikaye 7-11 dk, gate/seçim anlarını bölüm işareti (chapter) yap.
8. **Küçük kanal gerçeği:** Yemek Arası 3.25K abonede 257K aldı, One Small If 6.5K abonede 296K. Abone sayısı engel değil; ama bu küçük kanallar medyanda 10K civarında kalıyor, yani her video değil birkaç tanesi patlıyor. Beklenti: 10 videodan 1-2 çarpan vuruşu.
9. **Türkçe pazar (Yemek Arası verisi):** Türkçe başlıklar "... Ne Olurdu?" kalıbı ve İngilizce hitlerin çevirisiyle (IQ, 500 IQ, anaokulu, silahlı saldırgan) 4 videoda 80K+ almış. Ancak Türkçe kanalın medyanı 9.8K. Türkçe için aynı mekaniğin (gizli sayı) denenmemiş varyantları boşluk olabilir (spekülasyon: kontrol için Türkçe aramayla ek tarama gerekir).

### Bilinmeyenler / sonraki adım
- Kapak rengi, yüz, yazı, karakter: doğrulanmadı (görseller indirilemedi).
- Gerçek kanal medyanları (tüm video listesi) yok, yalnızca popüler ilk 23-30.
- Kota yenilenince (2026-11-21): `youtube_video_details` ile eksik 3 videonun detayı + `get_similar_thumbnails` ile kapak kümesi, ayrıca IFopposite'in 399K'lık videosu.

## Ek: kullanılan video ID'leri (kanal başına en iyi)

| Kanal | Video ID | İzlenme |
|---|---|---|
| Ifverse | MroF1XmHOZw | 4,732,590 (details) |
| Ifinite | u2GyTKhHsTQ | 1,846,922 (details) |
| Jeremy Bearimy | aV7_cA_xVXI | ~1.9M (liste) |
| Alternate You | UgIdpJG13Gc | 803,484 (details) |
| DOOMPERK | X_wiaDTxSho | 732,810 (details) |
| Manifesting | ncziskWQbQA | ~976K (liste) |
| Hypothetically | xPzwR_Y698o | ~6.4M (liste) |
| Trace Écrite | A0QwHh0PU5Q | 367,631 (details) |
| One Small If | KzdIyAqm15c | ~296K (liste) |
| Yemek Arası | F1KuVENxdYU | 257,652 (details) |
