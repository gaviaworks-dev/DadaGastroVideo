<?php
// Reklam modülünün (full-stack Gastro, ../gastro-video) Blade bileşenlerini GERÇEK kodla render eder ve JSON basar.
// reklam ajanı · araclar/reklam-varlik.mjs çağırır; elle de koşulabilir:
//   php araclar/reklam-render.php "<gastro kökü>" > /tmp/x.json
// Yalnız OKUR: dev MySQL'den (gastro_v2_video, .env'deki bağlantı) kreatif satırlarını SELECT eder, bileşeni çizer. Önbellek ve oturum
// bu süreçte bellekte (array); rota kaydı için REKLAM_ENABLED yalnız bu sürecin ortamında açılır. Hiçbir satır yazılmaz (kapı önce/sonra sayar).
// Jeton yerine 'J<kreatif id>' kullanılır; tıklama adresi derlemede kreatifin hedef_url'sine çevrilir.

$kok = $argv[1] ?? '';
if (!is_file($kok.'/bootstrap/app.php')) { fwrite(STDERR, "gastro kökü yok: $kok\n"); exit(2); }
foreach (['REKLAM_ENABLED' => 'true', 'REKLAM_VIDEO' => 'true', 'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync', 'LOG_CHANNEL' => 'stderr', 'APP_URL' => 'http://ornek.invalid'] as $a => $d) { putenv("$a=$d"); $_ENV[$a] = $d; $_SERVER[$a] = $d; }
chdir($kok);
require $kok.'/vendor/autoload.php';
$app = require $kok.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Modeller\Sistem\ReklamKreatifi;
use App\Servisler\Reklam\MarkaRengi;
use App\Servisler\Reklam\SlotSunumu;
use Illuminate\Support\Facades\Blade;

// Video sayfaları (StandartReklamlar::uygunYol, IncelemeModu::videoYeriUygun) için istek bağlamı; yönetici önizlemesi izni (demo görünür).
$istek = Illuminate\Http\Request::create('/video-mutfagi', 'GET');
$istek->attributes->set('rk.admin.preview.allowed', true);
$app->instance('request', $istek);
Illuminate\Support\Facades\URL::forceRootUrl('http://ornek.invalid');

$sunum = fn (string $kod, ReklamKreatifi $k) => new SlotSunumu($kod, $k, 'J'.$k->id, $kod);
$kreatif = function (int $id) { $k = ReklamKreatifi::query()->find($id); if (!$k) throw new RuntimeException("kreatif yok: $id"); return $k; };
$cikti = ['kaynak' => trim((string) shell_exec('git -C '.escapeshellarg($kok).' log -1 --format=%h')), 'parcalar' => [], 'kreatifler' => [], 'renkler' => []];

// slot: [ad, alan kodu, bicim, kreatif id]
$slotlar = [
  ['serit-VD-B1', 'VD-B1', 'serit', 91],       // Arzum (sahne) · hub üst şerit (videolu banner kapalıyken)
  ['serit-VD-B1-END', 'VD-B1-END', 'serit', 130], // Pınar · hub alt şerit
  ['serit-VS-B1', 'VS-B1', 'serit', 92],       // Tefal · seriler üst
  ['serit-VS-B1-END', 'VS-B1-END', 'serit', 131], // Pınar · seriler alt
  ['serit-VD-S1', 'VD-S1', 'serit', 93],       // Tefal · seri üst
  ['serit-VD-S1-END', 'VD-S1-END', 'serit', 132], // Pınar · seri alt
  ['serit-SF-P1', 'SF-P1', 'serit', 90],       // Söke · şef profili üst
  ['serit-SF-P1-END', 'SF-P1-END', 'serit', 129], // Pınar · şef profili alt
  ['kart-VD-N1', 'VD-N1', 'kart', 109],        // KRUPS · hub liste kartı (native_module)
];
foreach ($slotlar as [$ad, $kod, $bicim, $id]) {
  $k = $kreatif($id);
  // VideoYerlesimi (karar 151) ilk yuvayı videolu banner'a çevirmesin: bu çağrı yuvanın KENDİ kreatifini istiyor.
  $istek->attributes->set('rk.preview.video', true);
  $cikti['parcalar'][$ad] = Blade::render('<x-reklam.slot :kod="$kod" :bicim="$bicim" :reklamlar="$r" />', ['kod' => $kod, 'bicim' => $bicim, 'r' => [$kod => $sunum($kod, $k)]]);
  $cikti['kreatifler'][$ad] = $id;
}
// V2 (patron revizesi 5 Kas, K6): video şefler dizini = modülün `sef-liste` planı (reklam-yayilim.php:19) — SF-L1 üst şerit (Karaca 89),
// SF-N2 dizinde 3. karttan sonra sponsorlu şef kartı (partials/kart/sef sponsor dalı; Tat 108), SF-L1-END alt şerit (Pınar 128).
if (in_array('v2', $argv, true)) {
  foreach ([['serit-SF-L1', 'SF-L1', 89], ['serit-SF-L1-END', 'SF-L1-END', 128]] as [$ad, $kod, $id]) {
    $istek->attributes->set('rk.preview.video', true);
    $cikti['parcalar'][$ad] = Blade::render('<x-reklam.slot :kod="$kod" bicim="serit" :reklamlar="$r" />', ['kod' => $kod, 'r' => [$kod => $sunum($kod, $kreatif($id))]]);
    $cikti['kreatifler'][$ad] = $id;
  }
  $cikti['parcalar']['sef-SF-N2'] = view('partials.kart.sef', ['sponsor' => $sunum('SF-N2', $kreatif(108)), 'kart' => null, 'sef' => null])->render();
  $cikti['kreatifler']['sef-SF-N2'] = 108;
}
// Videolu banner (STD-VIDEO, karar 151): ilk yayılım yuvasının yerine — yuvanın kendi kreatifi data-rk-review-static hidden içinde kalır.
$istek->attributes->set('rk.preview.video', false);
$video = $kreatif(101);
$cikti['parcalar']['video-STD-VIDEO'] = Blade::render('<x-reklam.standart bicim="video" :sunum="$s" :vitrin="true" />', ['s' => $sunum('STD-VIDEO', $video)]);
$cikti['kreatifler']['video-STD-VIDEO'] = 101;
// Standart katman: side çifti (sol Migros STD-SIDE-LEFT, sağ Uber Eats STD-SIDE) + alt sabit bar (Namet STD-ALTBAR); pop-up prototipte yok (karar R3).
foreach ([['side-STD-SIDE-LEFT', 'STD-SIDE-LEFT', 'side', 137], ['side-STD-SIDE', 'STD-SIDE', 'side', 98], ['altbar-STD-ALTBAR', 'STD-ALTBAR', 'altbar', 100]] as [$ad, $kod, $bicim, $id]) {
  $cikti['parcalar'][$ad] = Blade::render('<x-reklam.standart :bicim="$b" :sunum="$s" />', ['b' => $bicim, 's' => $sunum($kod, $kreatif($id))]);
  $cikti['kreatifler'][$ad] = $id;
}
// TD-ESLIK eşlik kartı: canlıdaki PIN Cool Lime kreatifi (kreatif 188; dev tabanda yok → canlı panel kaydının değerleriyle KAYDEDİLMEYEN model,
// rapor/reklam/RAPOR-td-eslik.md §5). Sipariş kanalları dev tabandaki TD-SIPARIS-YS (Yemeksepeti Market) ve TD-SIPARIS-A101 (Migros Hemen).
$pin = new ReklamKreatifi();
$pin->forceFill(['id' => 188, 'marka' => 'PIN', 'baslik' => 'PIN Cool Lime', 'metin' => '250 ml cam şişe · Yemeğinizin yanında', 'cta' => 'İncele',
  'gorsel_turu' => 'urun', 'gorsel_yolu' => 'reklam/kreatif/pin-cool-lime-600.png', 'gorsel_genislik' => 201, 'gorsel_yukseklik' => 600,
  'logo_yolu' => 'reklam/kreatif/pin-logo-512.png', 'birincil_renk' => '#153158', 'hedef_url' => 'https://pindrinks.com/urunlerimiz/pin-cool-lime-koli-paketi-250-ml-x-12li-cam', 'durum' => 'aktif']);
$kanallar = [null, $sunum('TD-SIPARIS-YS', $kreatif(139)), $sunum('TD-SIPARIS-A101', $kreatif(142)), null, null, null];
$cikti['parcalar']['eslik-TD-ESLIK'] = Blade::render('<x-reklam.eslik-karti :sunum="$s" oneri="limonata" kaynak="ornek-tarif" :partnerler="$p" />', ['s' => $sunum('TD-ESLIK', $pin), 'p' => $kanallar]);
$cikti['eslik'] = ['marka' => 'PIN', 'oneri' => 'Limonata', 'hedef_url' => $pin->hedef_url, 'gorsel' => $pin->gorsel_yolu, 'logo' => $pin->logo_yolu, 'kreatif' => 188];
// Seri sponsor etiketi (VideoServisi::seriSponsoru → `.rk-native-hap`, arayuz_video.hub.sponsorlu)
$cikti['sponsor_kalibi'] = __('arayuz_video.hub.sponsorlu', ['ad' => '%AD%']);
$cikti['sponsorlu'] = __('arayuz_bilgi.ortak.sponsorlu');

// kreatif ayrıntıları (dönüştürme için)
$idler = array_values(array_unique(array_merge(array_values($cikti['kreatifler']), [139, 142])));
foreach ($idler as $id) {
  $k = $kreatif($id);
  $cikti['kayit'][$id] = ['marka' => $k->marka, 'baslik' => $k->baslik, 'hedef_url' => $k->hedef_url, 'gorsel' => $k->gorsel_yolu, 'mobil' => $k->mobil_gorsel_yolu, 'logo' => $k->logo_yolu, 'video' => $k->video_yolu, 'renk' => $k->birincil_renk, 'gw' => $k->gorsel_genislik, 'gh' => $k->gorsel_yukseklik];
  $cikti['renkler'][MarkaRengi::kod($k->birincil_renk)] = MarkaRengi::css($k->birincil_renk);
}
$cikti['renkler'][MarkaRengi::kod('#153158')] = MarkaRengi::css('#153158');
echo json_encode($cikti, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), "\n";
