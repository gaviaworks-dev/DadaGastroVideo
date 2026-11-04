/* Sabit alt-köşe öğe çakışması — ORTAK ölçüm+offset mantığı (R5 madde 4,
   kapanış turu 2026-08-08). bottom-clearance.css ile BİRLİKTE çalışır.
   Mekân detay (.vd-actbar × Mentor × .yg-fab × .to-top) VE tarif detay
   (.rd-actbar × Mentor × .yg-fab × .to-top) TEK bu dosyadan beslenir —
   ikinci kopya yazılmadı.

   Sözleşme: engel taşıyan sabit öğeler (aksiyon barı, `.to-top`) `data-bc-bar`
   taşır (görünürlüğü kendi sayfa script'i `.show` class'ıyla yönetir — bu
   dosya o state'i DEĞİŞTİRMEZ, yalnız okur). Kaydırılacak öğeler (Mentor
   paneli, Dada Route FAB) `data-bc-clear` taşır. Hepsi `position:fixed`
   olduğundan `getBoundingClientRect()` scroll'dan bağımsız viewport
   koordinatı döner (scrollY EKLENMEZ — sabit öğede scrollY eklemek sahte
   çakışma ölçer, bkz. docs/lessons.md).

   R1 (docs/lessons.md, "Çakışmayı çakışmayla değiştirmek", ölçüldü) — İLK
   sürüm yalnız TEK barla (aksiyon çubuğu) kıyaslıyordu; FAB'ı barın üstüne
   kaldırınca sağ-altta ONDAN da yukarıda duran `.to-top` (`bottom:92px,
   z-index:55`) ile TAM örtüştü (768'de kesişim FAB kutusunun %98'i) —
   çözüm çakışmayı gizlemeden kaldırdı ama YENİ bir çakışma üretti.

   R2 (ölçüldü) — `.to-top`'un KENDİSİ de aksiyon barıyla çakışıyordu (tarif
   390'da bar 2 satıra bölününce 94px'e uzuyor, `.to-top`'un sabit
   `bottom:148px` konumu bu genişlikte barın İÇİNE düşüyor — R5'ten ÖNCE de
   var olan, ayrı bir kusur). Bu yüzden `.to-top` HEM `data-bc-bar` (FAB onu
   engel sayar) HEM `data-bc-clear` (kendisi de aksiyon barından kaçar) —
   iki aşamalı çözülür:
     Aşama 1 — yalnız `data-bc-clear` TAŞIMAYAN "sabit" barlar (aksiyon
       çubuğu) referans alınıp kendi kayan-barlar (`.to-top`) yerleşir.
     Aşama 2 — TÜM barların (sabit + Aşama 1'de yerleşmiş `.to-top`) GÜNCEL
       konumuna göre geri kalan `data-bc-clear` öğeleri (Mentor, FAB) yerleşir
       — FAB böylece hem aksiyon çubuğunu HEM `.to-top`'un NİHAİ konumunu
       aynı anda geçer, ikisi çakışmaz.
   Ders (docs/lessons.md): kaydırma yönündeki TÜM sabit komşular envanterlenir
   VE komşunun kendisi de bir üst engelle çakışıyor olabilir — tek katman
   yeterli değil.

   Hesap: yalnız GERÇEKTEN kesişen (hem dikey HEM yatay) çift için, obstacle
   barın üstüne `--sp-3` (12px, tokens.css) boşluk bırakacak kadar itilir.
   Kesişme yoksa (ör. 1440px'te bar ile FAB arasında 201px boşluk, ölçüldü)
   `--bc-lift` 0'a döner — hiçbir şey kaymaz. */
(function () {
    function gapToken() {
        var v = getComputedStyle(document.documentElement).getPropertyValue('--sp-3');
        var n = parseFloat(v);
        return isNaN(n) ? 12 : n;
    }

    // R0 (ölçüldü) — apply() birden fazla kez tetiklenebiliyor (scroll +
    // resize + bar/obstacle transitionend hepsi kendi tetikleyicisi). İkinci
    // çağrıda `el.getBoundingClientRect()` ARTIK bir önceki `--bc-lift`'i
    // yansıtıyor; o mesafeyi tekrar barRect.top'tan çıkarmak lift'i HER
    // seferinde bir önceki uygulanan miktar kadar EKSİK hesaplıyordu (tarif
    // 390'da bar 2 satıra bölündüğü için birden fazla tetikleyici üst üste
    // geliyor, sonuç kalıcı olarak yarım kalıyordu — ölçüldü, FAB barın
    // içinde kalıyordu). Çözüm: her öğenin DOĞAL (lift uygulanmamış) konumu
    // kendi son uyguladığımız lift değeriyle geri hesaplanır, konum HER
    // seferinde bu doğal referanstan yeniden ölçülür — çağrı sırasından
    // bağımsız, idempotent.
    var appliedLift = new WeakMap();

    function setLift(el, px) {
        el.style.setProperty('--bc-lift', px + 'px');
        appliedLift.set(el, px);
    }

    function naturalRectOf(el) {
        var prevLift = appliedLift.get(el) || 0;
        var r = el.getBoundingClientRect();
        // Doğal (lift=0 iken olacağı) dikdörtgen: yalnız top/bottom kayar,
        // left/right lift'ten etkilenmez.
        return { top: r.top + prevLift, bottom: r.bottom + prevLift, left: r.left, right: r.right };
    }

    // Verilen öğeyi verilen bar dikdörtgenleri listesine göre yerleştirir.
    // TEK geçişte en büyük lift'i almak YETMEZ (R1'in çözümünde ölçüldü):
    // bir engeli geçecek kadar itmek öğeyi BAŞKA bir engelin İÇİNE sokabilir
    // (ör. barı geçen FAB, to-top'un tam konumuna oturuyordu). Bu yüzden
    // "kararlı hâle gelene kadar it" döngüsü: her turda TÜM barlarla yeniden
    // kesişme kontrol edilir, hâlâ kesişen varsa üstüne çıkacak kadar daha
    // itilir; hiçbiri kesişmeyince durur. Bar sayısı sabit (küçük) olduğundan
    // döngü kısa sürede kararlı hâle gelir.
    function settle(el, barRects) {
        var natural = naturalRectOf(el);
        var gap = gapToken();
        var top = natural.top, bottom = natural.bottom;
        var maxIterations = barRects.length + 2;
        for (var i = 0; i < maxIterations; i++) {
            var moved = false;
            barRects.forEach(function (barRect) {
                if (!barRect) return;
                var h = Math.min(natural.right, barRect.right) - Math.max(natural.left, barRect.left);
                if (h <= 0) return;
                var v = Math.min(bottom, barRect.bottom) - Math.max(top, barRect.top);
                if (v <= 0) return;
                var shift = bottom - (barRect.top - gap);
                if (shift > 0) { bottom -= shift; top -= shift; moved = true; }
            });
            if (!moved) break;
        }
        setLift(el, Math.round(natural.bottom - bottom));
    }

    function apply() {
        var clears = document.querySelectorAll('[data-bc-clear]');
        if (!clears.length) return;
        var allBars = [].slice.call(document.querySelectorAll('[data-bc-bar]'));

        // Aşama 1: yalnız `data-bc-clear` TAŞIMAYAN sabit barlara (aksiyon
        // çubuğu) göre, kendisi de kayabilen barlar (`.to-top`) yerleşir.
        var fixedBarRects = allBars
            .filter(function (b) { return !b.hasAttribute('data-bc-clear') && b.classList.contains('show'); })
            .map(function (b) { return b.getBoundingClientRect(); });
        allBars.forEach(function (bar) {
            if (!bar.hasAttribute('data-bc-clear')) return;
            if (!bar.classList.contains('show')) { setLift(bar, 0); return; }
            settle(bar, fixedBarRects);
        });

        // Aşama 2: TÜM barların (sabit + Aşama 1'de güncellenmiş kayan-barlar)
        // GÜNCEL konumuna göre geri kalan data-bc-clear öğeleri (Mentor, FAB)
        // yerleşir.
        var allBarRectsNow = allBars
            .filter(function (b) { return b.classList.contains('show'); })
            .map(function (b) { return b.getBoundingClientRect(); });
        clears.forEach(function (el) {
            if (el.hasAttribute('data-bc-bar')) return; // Aşama 1'de zaten işlendi.
            settle(el, allBarRectsNow);
        });
    }

    var raf = null;
    function schedule() {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = null; apply(); });
    }

    function init() {
        apply();
        window.addEventListener('resize', schedule);
        window.addEventListener('scroll', schedule, { passive: true });
        document.querySelectorAll('[data-bc-bar]').forEach(function (bar) {
            new MutationObserver(schedule).observe(bar, { attributes: true, attributeFilter: ['class'] });
        });
        // Bar/obstacle geçiş animasyonu bitince son konumu bir kez daha
        // doğrula (transition sırasında ara kareler yanlış geometri verir).
        document.querySelectorAll('[data-bc-bar],[data-bc-clear]').forEach(function (el) {
            el.addEventListener('transitionend', schedule);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    window.BottomClearance = { apply: apply };
})();
