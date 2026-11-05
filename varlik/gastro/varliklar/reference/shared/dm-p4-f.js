/* ajan F · liste süzgeç paneli — PARTİ 4
   BAĞI lead attı; İÇERİĞİNİ yalnız kendi kulvarı yazar.
   KAYNAK BURASI: scripts/p4-varlik/dm-p4-f.js — ağaca kopyalanır.

   L7 · TEK İŞİ: header'ın alt kenarını ÖLÇÜP --f-hdr-alt'a yazmak.
   Sabit sayı yazılmaz (brief şartı): header saydam(at-top) ↔ solid
   kipleri arasında yükseklik DEĞİŞEBİLİR. Bu ağaçta ölçüm ikisinde de
   aynı çıktı (113px @≥1025, 63px @390) ama ölçüm yine de canlı yapılır.

   Kaydırmada ölçüm YAPILMAZ (her karede getBoundingClientRect = zorunlu
   yeniden yerleşim). Header sınıfı değiştiğinde MutationObserver tetikler
   — at-top/tepede takası tam o an olur.

   İKİNCİ İŞ · --f-alt-engel: ekranın DİBİNİ örten sabit katman (çerez
   bandı #cookieBanner) panelin ayağını gizliyordu — ÖLÇÜLDÜ, ekran
   görüntüsüyle görüldü (rapor/ss/p4/f-sonra-1440-kaydirilmis.png ilk
   hâli): "Tümünü Temizle / N Tarifi Göster" bandın ARDINDA kalıyordu.
   Bant görünürken yüksekliği panelin max-height'ından düşülür, kullanıcı
   bandı kapatınca 0'a döner. Sabit sayı yok, ölçülen değer.            */
(function () {
  'use strict';
  var panel = document.getElementById('lstSide');
  if (!panel) return;                       /* kulvar dışı sayfa */
  var head = document.querySelector('header.header');
  if (!head) return;

  var sonAlt = null, sonEngel = null;

  /* ekranın dibini örten sabit katmanın panele düşen yüksekliği */
  function altEngel() {
    var e = document.getElementById('cookieBanner');
    if (!e) return 0;
    var c = getComputedStyle(e);
    if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return 0;
    if (c.position !== 'fixed') return 0;
    var r = e.getBoundingClientRect();
    if (!(r.height > 0)) return 0;
    /* ÖLÇÜLDÜ (1440×950): bant t=831,6 b=926,4 — dibe YAPIŞIK DEĞİL, altında
       23,6px boşluk var. "b >= innerHeight" şartı bu yüzden yanlış olurdu.
       Örtülen yükseklik bandın ÜSTÜNDEN ekranın dibine kadar olan mesafedir. */
    if (r.top > innerHeight - 1 || r.bottom < innerHeight * 0.75) return 0;  /* dipte değil */
    var pr = panel.getBoundingClientRect();
    if (r.right < pr.left || r.left > pr.right) return 0;          /* kolonu örtmüyor */
    return Math.round(Math.min(innerHeight - r.top, innerHeight));
  }

  function olc() {
    var alt = Math.round(head.getBoundingClientRect().bottom);
    /* header fixed değilse (kaydırılmış statik header) 0'a düşebilir —
       negatif/absürt değer yazma, son geçerliyi koru */
    if (alt > 0 && alt <= 400 && alt !== sonAlt) {
      sonAlt = alt;
      document.documentElement.style.setProperty('--f-hdr-alt', alt + 'px');
    }
    var eng = altEngel();
    if (eng !== sonEngel) {
      sonEngel = eng;
      document.documentElement.style.setProperty('--f-alt-engel', eng + 'px');
    }
  }

  var bekleyen = false;
  function planla() {
    if (bekleyen) return;
    bekleyen = true;
    requestAnimationFrame(function () { bekleyen = false; olc(); });
  }

  olc();
  addEventListener('load', planla, { once: true });
  addEventListener('resize', planla, { passive: true });
  new MutationObserver(planla).observe(head, { attributes: true, attributeFilter: ['class', 'style'] });
  /* çerez bandı açılıp kapanınca yeniden ölç (gövde altına da sonradan eklenebilir) */
  new MutationObserver(planla).observe(document.body, { childList: true, subtree: false });
  var bant = document.getElementById('cookieBanner');
  if (bant) {
    new MutationObserver(planla).observe(bant, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    /* 🔴 "geçiş ortasında ölçüm" — bant .show sınıfıyla .42s translateY/opacity
       geçişiyle girip çıkıyor. Sınıf değişiminde okunan değer ARA DEĞERDİR:
       girerken ekranın altında (0 ölçülür), çıkarken hâlâ dipte (102 ölçülür)
       ve son mutasyon olmadığı için değer ORADA DONAR. Kapı bunu 16 sayfanın
       1'inde yakaladı (en__tarifler, 694px ≠ 796px). Geçiş BİTİNCE ölç. */
    bant.addEventListener('transitionend', planla);
    bant.addEventListener('animationend', planla);
  }
})();
