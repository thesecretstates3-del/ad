# Oyun Planı: Kurgu Odaklı (taslak 1)

## İncelenen kaynaklar
**Kurulu repo:** gamedev-skills/awesome-gamedev-agent-skills (sohbetin başında kurduğumuz paket)
- **visual-novel:** Dallanan hikâye yapısı. Rota haritası, kilitlenme noktası, sonlar, bayraklar, kayıt sistemi.
- **dialogue-systems:** Hikâyeyi veri olarak tutmak (Ink, Yarn ya da JSON grafiği). Bayraklar, koşullu seçimler, "her seçimin sonradan bir karşılığı olmalı" kuralı.
- **game-docs:** Tek sayfalık oyun tasarım dokümanı (GDD) ve özellik notları.
- **prototype-fast:** Tek soruya cevap veren hızlı prototip.
- **level-design:** Kilitli kapılar, "hangi anahtar nerede" ve yumuşak kilitlenme kontrolü.
- **save-systems:** Bölümler arası kalıcı kayıt.
- **itch-publish:** Tarayıcıda yayın.

**Diğer çok yıldızlı repolar:**
- **inkle/ink** (~5 bin yıldız): Profesyonel dallanan anlatım dili. 80 Days ve Heaven's Vault oyunlarında kullanıldı; tarayıcı sürümü inkjs.
- **mhgolkar/Arrow** (~1,4 bin): Görsel anlatı tasarım aracı, düğüm haritası.
- **ellisonleao/magictools** (~17,8 bin) ve **Roobyx/awesome-game-design** (~700): Oyun tasarımı kaynak listeleri.
- **Shanyin-ai/Story-to-game** (~500) ve **Comedian1926/OpenFMV** (~240): Dallanan hikâyeyi ve **etkileşimli videoyu** oyuna çeviren araçlar. Videoyla oyunu bağlama fikrimize en yakın örnekler.

---

## 1. Ana fikir
**Tek evren, tek karakter, her bölüm yeni bir "geçit".**
- **Video (10–14 dk):** Bölümün anlatıcı tarafından seçilen yolu. Rakip kalitesinde, sinematik ve merak uyandıran bir hikâye.
- **Oyun (bölüm başına 30–45 dk):** Aynı bölümün tam, dallanan hâli. Videoda seçilmeyen yol, gizli üçüncü yol ve gerçek son oyunda.
- **Kural:** Video oyunun **giriş kapısı**, oyun da videonun **devamı**. Biri olmadan öteki eksik kalır.

## 2. Video ile oyun nasıl birbirine kenetlenir
| Bağlantı | Nasıl çalışır |
|---|---|
| Videodaki ipucu, oyunda anahtar | Videoda 1–2 saniyelik bir detay görünür: bir saat, bir sayı, bir sembol. Oyundaki gerçek sona giden kilit yalnızca bu bilgiyle açılır. Videoyu izlemeyen gerçek sona ulaşamaz. |
| Oyundaki seçim, videodaki gerçek veri | Oyuncuların seçim oranları bir sonraki videoda **gerçek istatistik** olarak gösterilir ("Oyuncuların %62'si A'yı seçti"). Uydurma oran yok. |
| Zincirleme merak | Oyunun gerçek sonu, bir sonraki bölümün geçidini gösterir. Videonun sonu da oyunu işaret eder ("Diğer kapının arkasında ne var? Oyunda."). |
| Ortak hafıza | Oyundaki kayıt bölümden bölüme taşınır. Örneğin önceki bölümde yardım ettiğin bir karakter, sonraki bölümde seni tanır. |

## 3. Bölüm kurgusu (oyun içinde)
visual-novel skill'indeki rota haritası mantığı ile rakip videolardaki anlatım bölümlerinin birleşimi:

```
GİRİŞ (ortak rota, ~%30)
  Çelişkili açılış sahnesi → güç ya da durum tanıtımı → gözlem bulmacası (kural keşfi)
        │
  KİLİTLENME NOKTASI: A/B geçitleri (seçim ekranı)
        │
   ┌────┴────┐
 B ROTASI   A ROTASI          (her biri ~%30)
 plan → ters tepme → kuralın değişmesi (bedel) → yabancının sırrı
   │ 2 son    │ 2 son
   └────┬────┘
 GERÇEK SON: iki rota bitmiş + videodaki ipucu girilmiş olmalı (~%10)
```

**Rakip anlatımındaki bölümlerin oyundaki karşılığı:**
| Rakip videodaki bölüm | Oyundaki mekanik |
|---|---|
| Çelişkili açılış | İlk sahne. Oyuncu tıklayarak çelişkiyi kendisi fark eder. |
| Kural, çelişkiden keşfediliyor | **Gözlem bulmacası:** İki örneği karşılaştırıp kuralı oyuncu çıkarır ve doğru cevabı seçer. Anlatıcı söylemez, oyuncu bulur. |
| Açgözlü plan ters tepiyor | Oyuncuya cazip bir seçenek sunulur. Seçerse bedelini sonraki sahnelerde görür. |
| Orta noktada kural değişiyor | Önceden öğrenilen kural bozulur; eski çözüm artık çalışmaz. |
| Yabancı insanlaşıyor | Yan görev: küçümsenen karakterin hikâyesi. Sonu değiştiren bir bayrak açar. |
| Twist | Gerçek son. Videodaki ipucu ve iki rotanın bilgisiyle açılır. |
| Tekrar eden şakalar | Her bölümde tekrar eden karakterler ve objeler. Oyuncu bulunca rozet kazanır. |

**Boyutlar** (visual-novel kurallarıyla):
- Okuma hızı dakikada 200–250 kelime. 30–45 dakikalık bir bölüm yaklaşık 6–9 bin kelime eder.
- Her 5–15 dakikada en az bir anlamlı seçim ya da tepki olmalı.
- Her önemli seçim, sonraki bir satırda görünür bir karşılık bulmalı; sahte seçim olmamalı.
- Bayrak tipleri: tek seferlik kararlar için evet/hayır bayrağı, ilişkiler için sayaç. Sonlara giden eşikler, oyuncunun bazı seçimleri kaçırmasına izin verecek kadar esnek olmalı.

## 4. Oyun dünyası (bölümler arası)
- **Ana menü bir koridor ya da harita.** Her bölüm bir geçit. Bitirilmemiş rotalar kilitli geçit olarak görünür (Metroidvania etkisi).
- **Koleksiyon:** Tekrar eden şakalar, gizli objeler ve videodaki ipuçlarıyla açılan rozetler.
- **Yeni bölüm takvimi:** Her video yayınlandığında oyunda yeni bir geçit açılır.

## 5. Teknik yol (önerim)
- **Görüntü:** PixiJS. Video render'ında kullandığımız karakter, rig ve sahneler aynı; çizim iki kez yapılmaz.
- **Hikâye dili:** Ink (inkjs). Dallanma, bayraklar, okunma sayıları ve doğrulama hazır geliyor. dialogue-systems skill'i "yeni bir hikâye dili icat etme" diyor.
- **Bağlantı:** Video ve oyun aynı Ink dosyasından beslenir. Video, sabit seçimli bir yürüyüşün render'ıdır. Oyun ise aynı dosyanın etkileşimli oynanışıdır.
- **Kayıt:** Tarayıcıda yerel kayıt. İleride hesap ve sunucu tarafında istatistik eklenebilir; videodaki gerçek oranlar için gerekli.
- **Yayın:** Önce itch.io (hızlı ve ücretsiz), sonra kendi siteniz.

## 6. İlk hedef (MVP)
1. **Bölüm 1 videosu:** 10–14 dakika, rakip kalitesinde metin.
2. **Bölüm 1 oyunu:** Ortak giriş, iki rota, her rotada iki son ve videodaki ipucuyla açılan gerçek son. Toplam 25–30 dakika.
3. **Prototip sorusu** (prototype-fast): "Oyuncu, videodaki ipucunu bulmak için videoyu yeniden izliyor mu?" Bu soru doğrulanınca ölçeklenir.

## 7. Kararınız gereken noktalar
1. **Video hangi yolu anlatsın?** Önerim: Yalnızca seçilen yolu ve gerçek sonun bir ipucunu. Diğer yol oyunda kalsın.
2. **Oyun ücretsiz mi olsun, yoksa bölümler ücretli mi?** Önerim: Başlangıçta ücretsiz; topluluk büyüdükten sonra karar verilir.
3. **Yeni ilk bölümün konusu:** Rakibin en iyi videolarındaki ölçütle, yani "seni başkalarıyla kıyaslatan" bir seçimle belirlenmeli.
