# Forever Young

Bu proje, birden fazla platformdan (Spotify, Apple Music, Deezer) çekilen popüler şarkıları tek ekranda listeleyen statik bir web sitesidir.

## Ozellikler
- Coklu platform chart verisi (Spotify / Apple Music / Deezer)
- Her sarki satirina tiklayinca YouTube arama sonucuna gitme
- Otomatik veri yenileme (istemci tarafinda periyodik kontrol)
- GitHub Actions ile duzenli scrape ve `data/charts.json` guncellemesi
- GitHub Pages uyumlu yayin yapisi (`root` ve `.dist`)

## Degisiklik Notlari
### 2026-03-29
- Site yapisi statik embed'den veri odakli dinamik listeye cevrildi.
- `app.js` eklendi ve chart verisi `data/charts.json` uzerinden render edilmeye baslandi.
- `scripts/scrape_charts.py` ile scrape otomasyonu eklendi.
- Coklu kaynak destegi eklendi: Spotify, Apple Music, Deezer.
- Sarki satirlari YouTube arama linkine baglandi.
- Konsol hatalarina neden olan embed yapisi kaldirildi.
- Tema VS Code koyu gorunumune yakin, sade bir stile cekildi.
- Ust bilgi metni ve veri guncelleme tarihi alani eklendi.
- Kartlardaki "Kaynak" metni kaldirildi.
- GitHub Actions workflow eklendi/guncellendi: `.github/workflows/update-charts.yml`.
- Deploy tetiklemek ve gereksiz python cache dosyalarini dislamak icin `.gitignore` eklendi.

## Gelistirme
Yerelde scrape calistirmak icin:

```bash
python scripts/scrape_charts.py
```

Yayinlanan veri dosyasi:
- `data/charts.json`

## Lisans
Su an icin lisans dosyasi tanimli degildir.
