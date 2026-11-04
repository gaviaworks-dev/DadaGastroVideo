/* DadaGastro kabuk davranışı — KAYNAK: FIT kabuk betiği (/Fit/fit-giris.html).
   ÜRETİLİR, ELLE DÜZENLENMEZ: scripts/gastro-public-revize.mjs --adim d6 */
(function(){
  if (window.__dmKabuk) return; window.__dmKabuk = true;
  var header = document.querySelector('.header');
  if (!header) return;
  /* İKİ KAPI, TEK CEVAP — kanon sayfalarının KENDİ kabuk betiği aynı
     soruyu body[data-fit-over=1] ile soruyor ve o kapı ÖLÇÜLMÜŞ
     (g-404, g-arama, g-giris ve hata ekranları gerçekten koyu bant
     taşıyor; ekran görüntüsüyle doğrulandı). İki betik aynı sınıfa
     dokunduğu için ikisi de AYNI cevabı vermeli — yoksa sonuç yükleme
     sırasına kalır. Bu yüzden burada da o nitelik okunur. */
  var hero = header.getAttribute('data-hero') === '1' ||
             document.body.getAttribute('data-fit-over') === '1';
  if (!hero || location.search.indexOf('hdr=solid') > -1) {
    header.classList.remove('at-top','tepede'); return;
  }
  function onScroll(){
    if (window.scrollY < 60) { header.classList.add('at-top'); header.classList.add('tepede'); }
    else { header.classList.remove('at-top'); header.classList.remove('tepede'); }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
})();
