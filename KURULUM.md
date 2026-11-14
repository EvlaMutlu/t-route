# Termessos Saha Defteri: Kurulum ve Kullanım

Telefonda çalışan bir web uygulaması. **Hülya Aybek** ve **Gökhan Deniz** aynı anda ya da farklı zamanlarda rota kaydeder, nokta işaretler, not yazar ve fotoğraf yükler. Tüm kayıtlar **Hülya Aybek'in Google Drive'ında** birikir:

- **"Termessos Saha Verileri"** Google E-Tablosu: Etaplar, Rotalar, Noktalar, Notlar ve Fotoğraflar sekmeleri. *Dosya → İndir → Microsoft Excel (.xlsx)* ile Excel olarak indirilebilir.
- **"Termessos Fotoğraflar / Etap adı /"** klasörleri: fotoğraflar `NoktaAdı_HA_20261114_103522.jpg` biçiminde kaydedilir (HA = Hülya Aybek, GD = Gökhan Deniz).

Uygulama adresi: **https://evlamutlu.github.io/t-road/**

Kurulumu Hülya Hanım bir kez, bilgisayardan yapar. Yaklaşık 10 dakika sürer.

---

## 1. Drive tarafını kurun (Hülya Aybek'in hesabıyla)

1. https://sheets.new adresini açın. Yeni bir e-tablo oluşur. Adını **Termessos Saha Verileri** yapın.
2. Menüden **Uzantılar → Apps Script**'i açın.
3. Açılan sayfadaki `Kod.gs` içeriğini tamamen silin. Bu depodaki `apps_script/Kod.gs` dosyasının **tamamını** kopyalayıp yapıştırın.
4. Kodun başındaki satırı kendi ekip şifrenizle değiştirin:
   ```js
   const EKIP_SIFRESI = "BURAYA-BIR-SIFRE-YAZIN";   →   const EKIP_SIFRESI = "termessos-ilkbahar-73";
   ```
   (Tahmin edilmesi zor bir şey seçin. Bu şifre GitHub'a **yazılmaz**, yalnızca bu kodda ve iki telefonda durur.)
5. **💾 Kaydet**'e basın. Üstteki işlev listesinden **kurulum**'u seçip **▶ Çalıştır**'a basın.
   - Google izin isteyecek: *İzinleri incele → hesabınızı seçin → "Google bu uygulamayı doğrulamadı" uyarısında **Gelişmiş → Termessos'a git (güvenli değil)** → İzin ver.*
     Uyarı normaldir: kodu siz yazdınız, Google onu incelemediği için bu uyarıyı gösterir. Kod yalnızca bu tabloya ve oluşturduğu fotoğraf klasörüne erişir.
   - Kurulum sekmeleri ve fotoğraf klasörünü oluşturur ve tabloyu 10 dakikada bir güncelleyecek zamanlayıcıyı kurar.
6. **Dağıt → Yeni dağıtım** seçeneğini açın. ⚙ simgesinden **Web uygulaması**'nı seçin ve şu ayarları yapın:
   - *Açıklama:* Termessos
   - *Şu kullanıcı olarak yürüt:* **Ben (Hülya Aybek'in e-postası)**
   - *Erişimi olan kullanıcılar:* **Herkes**
   - **Dağıt**'a basın. Çıkan **Web uygulaması URL'sini** (`https://script.google.com/macros/s/…/exec`) kopyalayın.

> "Herkes" ayarı, telefonların Google'a giriş yapmadan veri gönderebilmesi için gereklidir. Ekip şifresini bilmeyen hiçbir istek kabul edilmez.
> Kodu ileride değiştirirseniz **Dağıt → Dağıtımları yönet → ✏️ → Sürüm: Yeni sürüm** ile güncelleyin. Böylece URL aynı kalır.

## 2. Telefonlarda ilk açılış

1. **Hülya Hanım'ın telefonunda** https://evlamutlu.github.io/t-road/ adresini açın. *Google Drive bağlantısı* ekranında web uygulaması URL'sini ve ekip şifresini girip **Bağlan ve devam et**'e basın.
2. **Menü → Ortağa kurulum bağlantısı** ile oluşan bağlantıyı Gökhan Bey'e WhatsApp'tan gönderin. Bağlantıyı açınca her şey kendiliğinden girilir. *(Bağlantının içinde şifre olduğu için ekip dışına göndermeyin.)*
3. Uygulamayı ana ekrana ekleyin:
   - **iPhone (Safari):** Paylaş → *Ana Ekrana Ekle*
   - **Android (Chrome):** ⋮ → *Ana ekrana ekle / Uygulamayı yükle*
4. Konum izni sorulunca **İzin ver** deyin. iPhone'da *Ayarlar → Gizlilik → Konum Servisleri → Safari Web Siteleri* açık olmalı ve "Tam Konum" seçili olmalı.

## 3. Sahaya çıkmadan önce (internet varken)

- Uygulamayı bir kez açın. Çevrimdışı çalışması için gereken dosyalar cihaza kaydedilir.
- Haritayı gezilecek alana getirin, **Menü → Çevrimdışı harita → Görünen alanı indir**'e basın. Uydu görüntüsü telefona kaydedilir. Alan büyükse birkaç parça halinde indirin.
- Telefonu tam şarj edin, powerbank alın. GPS kaydı ekran açıkken pil tüketir.

## 4. Kullanım

**Her açılışta** uygulama şunları sorar:
1. **Kim giriş yapıyor?** Hülya Aybek / Gökhan Deniz
2. **Yeni etap mı, mevcut etap mı?** Yeni bir etap başlatabilir ya da önceki bir etaba devam edebilirsiniz.

| Düğme | Ne yapar |
|---|---|
| ⏺ **Rota kaydı** | Yürüdüğünüz yolu GPS ile kaydeder. Tekrar basınca kayıt durur. Yol bilgisi olmayan arazide rotayı bu şekilde siz oluşturursunuz. |
| 📍 **Not / Foto** | Bulunduğunuz yere (ya da haritada seçtiğiniz yere) bir nokta ekler: unsur türü, başlık, not ve fotoğraflar. |
| 🗂 **Kayıtlar** | Rotaları, noktaları ve etapları listeler. Her satırda kimin, ne zaman girdiği yazar. |
| ☰ **Menü** | Kullanıcı veya etap değiştirme, eşitleme durumu, dışa aktarma (GeoJSON, GPX, CSV), çevrimdışı harita, GPS ayarları. |

**Rotalar:** turuncu çizgi Hülya Aybek'in, mavi çizgi Gökhan Deniz'in rotasıdır. Düz çizgi GPS kaydını, kesikli çizgi elle çizilen rotayı, soluk çizgi önceki etapları gösterir. İki kişi aynı anda kayıt yaparsa iki ayrı rota oluşur ve karşı tarafın son konumu baş harfleriyle görünür.
**Rotayı düzenleme:** rotaya dokunun ve *Düzenle*'yi seçin. Şunları yapabilirsiniz:
- noktaları sürüklemek veya silmek,
- kesikli halkayı sürükleyerek araya nokta eklemek,
- haritaya dokunarak sona nokta eklemek,
- *Sadeleştir* ile GPS titremesini temizlemek,
- *Buradan böl* ile rotayı ikiye ayırmak,
- *Geri al* ile son işlemi geri almak.

Her iki kullanıcı da her rotayı düzenleyebilir; kimin düzenlediği kayıtta görünür.
**Elle rota:** Kayıtlar → Rotalar → *Elle yeni rota çiz*.
**Noktalar:** iki kişi aynı noktaya ayrı ayrı not ve fotoğraf ekleyebilir. Her notun ve fotoğrafın yanında yazanın ya da çekenin adı ve saati durur.
**Görünüm (👁):** yalnız aktif etabı ya da tüm etapları birlikte (birikimli) görebilirsiniz. İki kullanıcının kayıtlarını birlikte ya da yalnız birinin kayıtlarını seçebilirsiniz.

## 5. İnternet yokken

Her kayıt önce telefona yazılır. Üstteki gösterge kaç kaydın beklediğini söyler ("Çevrimdışı · 12"). Çekim gelince kayıtlar ve fotoğraflar kendiliğinden Drive'a gider. Diğer telefonun girdileri ~20 saniye içinde görünür. **Gösterge "Eşit" (yeşil) olmadan uygulamayı silmeyin ve tarayıcı verilerini temizlemeyin.**

## 6. Bilinmesi gerekenler

- **Ekran kilitlenince GPS kaydı durur.** Telefon tarayıcıları arka planda konum vermez. Uygulama kayıt sırasında ekranı açık tutmaya çalışır. Ekran kapanırsa, açtığınızda kayıt sürer ve boşluk düz çizgiyle birleşir. Bunu *Rotayı düzenle* ile düzeltebilirsiniz.
- Ağaç altında ve kayalık yamaçlarda GPS sapabilir. Menü → GPS ayarlarından *en kötü doğruluk* (varsayılan 35 m) ve *minimum nokta aralığı* (varsayılan 4 m) değiştirilebilir.
- **"_kayitlar" ve "_fotolar" sekmelerini elle değiştirmeyin.** Uygulama bu sekmelerle çalışır. Okunur sekmeler (Etaplar, Rotalar…) her güncellemede yeniden yazılır. Kendi notlarınız için ayrı bir sekme açın.
- Silinen kayıtlar kalıcı olarak silinmez. `_kayitlar` sekmesinde `deleted = 1` olarak durur. Geri getirmek için bu değeri `0` yapın ve aynı satırın `seq` değerini büyük bir sayı yapın (ör. 999999).
- Fotoğraflar "bağlantıya sahip olan herkes görüntüleyebilir" ayarıyla kaydedilir. Uygulamanın fotoğrafları gösterebilmesi için bu gereklidir. Bağlantılar tahmin edilemez, ama tabloyu dışarıya paylaşırken bunu bilin.
- Google'ın ücretsiz hesap sınırları bu kullanım için fazlasıyla yeterlidir. Fotoğraflar Hülya Hanım'ın 15 GB'lık Drive alanından yer kaplar (her biri ~0,5–1 MB).
