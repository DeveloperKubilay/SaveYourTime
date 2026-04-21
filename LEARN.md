# LEARN

Bu dosya, SaveYourTime projesini hızlı öğrenmek isteyen geliştiriciler için kısa bir rehberdir.

## Proje Nedir?

SaveYourTime, belirli web siteleri için günlük kullanım süresi limiti koyan bir tarayıcı eklentisidir.

## Temel Yapı

- `manifest.json`: Eklentinin ana tanımı, izinler ve giriş noktaları
- `background.js`: Arka plan süreçleri ve zaman kontrol mantığı
- `script.js`: İçerik betiği (ziyaret edilen sayfalarda çalışan kısım)
- `html/`: Popup ve ayarlar sayfaları
- `js/`: Arayüz ve yardımcı scriptler
- `languages/`: Çoklu dil çeviri dosyaları
- `public/`: CSS, ikonlar, fontlar gibi statik dosyalar

## Akış Mantığı (Yüksek Seviye)

1. Kullanıcı hedef site ve süre limiti tanımlar.
2. Eklenti aktif sekmelerde geçirilen süreyi takip eder.
3. Limit aşımında kullanıcıya bildirim/uyarı gösterilir.
4. Kullanıcı ek süre verebilir veya limiti yönetim ekranından günceller.

## i18n (Dil Sistemi)

- Arayüz çevirileri `languages/` altındaki JSON dosyalarından okunur.
- `js/lang.js`, `data-lang` benzeri öznitelikler üzerinden metinleri uygular.
- Bir çeviri anahtarı yoksa mevcut metin korunur.

## Geliştirme Sırasında Kontrol

- Eklentiyi unpacked olarak yükleyin.
- Popup ekranını ve ayarlar ekranını ayrı ayrı test edin.
- Birkaç farklı domain için süre limiti davranışını doğrulayın.
- Bildirim ve limit aşımı senaryolarını manuel kontrol edin.

## Yeni Katkı Yapacaklar İçin Öneri

1. Önce `manifest.json`, `background.js` ve `script.js` dosyalarını okuyun.
2. Ardından `html/` ve `js/` klasörlerindeki UI akışını takip edin.
3. Son olarak `languages/` yapısını inceleyerek i18n mantığını anlayın.

Bu sırayla ilerlemek projeyi en hızlı şekilde kavramanızı sağlar.
