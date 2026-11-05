// Video Mutfağı V2 · Gastro şef kartı BİREBİR (izle ajanı). Hub da bunu çağırır.
// donör (yerel Gastro http://127.0.0.1:8960, JS koşmuş render edilmiş DOM, 5 Kas):
//   · tur 'dizin' → /sefler  `#sefGrid.sef-grid > article.sef-card`  (partials/kart/sef.blade.php)
//       CSS: /varliklar/reference/sefler/sefler.css + /gastro/sef-imza.css (+ portal/tokens) — kabuk V2 başlığına ekler
//   · tur 'usta'  → /  "Tarifin ustaları"  `.chef-row.drag-scroll > div.chef-card`
//       CSS: portal (.chef-card/.chef-av/.chef-follow) + /gastro/sef-avatar.css + /gastro/sef-imza.css
// İki kart farklıdır: 'dizin' dikey dizin kartı (ad, unvan/kademe çipi, tarif sayısı, Takip Et); 'usta' yatay raydaki küçük kart
// (avatar, ad, "N tarif", Takip Et). Kullanım yeri: 'dizin' → şef ızgarası ve izleme sayfasının seri sunucusu kartı;
// 'usta' → kaydırmalı şef rayları (hub "Şefler" rayı).
// Donörden ÇIKARILANLAR (prototip kuralı): takipçi sayısı (`.sef-meta` ikinci `.it` fa-users) basılmaz; POST formunun action/csrf'i yok
// (takip yalnız bellekte: düğme `data-vd-takip`; davranış video.js/sayfa js'i). Kalan her şey donörün sınıf, sıra ve metniyle aynı.

/** Topluluk kademeleri (gastro_v2_video `kademeler`, SELECT ad, sira): sira ≥ 6 → `r-high` + fa-trophy (SefServisi::ustKademeMi). */
export const KADEME_SIRA = { 'Çırak': 1, 'Mutfak Meraklısı': 2, 'Çömez Aşçı': 3, 'Komi': 4, 'Aşçı Yamağı': 5, 'Kıdemli Yamak': 6, 'Hat Aşçısı': 7, 'Aşçı': 8, 'Kıdemli Aşçı': 9, 'Kısım Şefi': 10, 'Sos Şefi': 11, 'Izgara Şefi': 12, 'Balık Şefi': 13, 'Kızartma Şefi': 14, 'Pasta Şefi': 15, 'Sous Şef': 16, 'Şef': 17, 'Kıdemli Şef': 18, 'Yönetici Şef': 19, 'Usta Şef': 20 };

const e = (o, x) => (o && o.esc ? o.esc(x) : String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
/** Doğrulanmış (editör) şef: Gastro'da `dogrulanmisSefMi()`; prototip verisinde unvanı "Dada'nın Şefi" olan (berkan.gunes). */
export const dogrulanmisMi = (sef) => /^dada/i.test(String(sef?.unvan || ''));
/** Gastro avatar baş harfi: adın İLK harfi (tek harf; parcalar.topluluk.avatar-ic). */
const basHarf = (sef) => String(sef?.ad || '?').trim().charAt(0).toLocaleUpperCase('tr-TR');
const onclickAdres = (adres) => `location.href='${String(adres).replace(/'/g, "\\'")}'`;
/** parcalar.topluluk.sef-tik (Dada'nın Şefi rozeti) — donörden aynen. */
const SEF_TIK = '<svg class="sef-tik" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path class="sef-tik-zemin" fill="currentColor" d="M12 1.05C12.52 1.05 13.1 1.73 13.56 2.12C14.03 2.51 14.3 3.23 14.8 3.39C15.29 3.55 15.93 3.13 16.54 3.09C17.15 3.05 18.01 2.83 18.44 3.14C18.86 3.45 18.92 4.34 19.07 4.93C19.22 5.52 19.02 6.26 19.32 6.68C19.63 7.1 20.39 7.14 20.91 7.46C21.43 7.78 22.25 8.12 22.41 8.62C22.58 9.11 22.1 9.87 21.88 10.44C21.65 11 21.05 11.48 21.05 12C21.05 12.52 21.65 13 21.88 13.56C22.1 14.13 22.58 14.89 22.41 15.38C22.25 15.88 21.43 16.22 20.91 16.54C20.39 16.86 19.63 16.9 19.32 17.32C19.02 17.74 19.22 18.48 19.07 19.07C18.92 19.66 18.86 20.55 18.44 20.86C18.01 21.17 17.15 20.95 16.54 20.91C15.93 20.87 15.29 20.45 14.8 20.61C14.3 20.77 14.03 21.49 13.56 21.88C13.1 22.27 12.52 22.95 12 22.95C11.48 22.95 10.9 22.27 10.44 21.88C9.97 21.49 9.7 20.77 9.2 20.61C8.71 20.45 8.07 20.87 7.46 20.91C6.85 20.95 5.99 21.17 5.56 20.86C5.14 20.55 5.08 19.66 4.93 19.07C4.78 18.48 4.98 17.74 4.68 17.32C4.37 16.9 3.61 16.86 3.09 16.54C2.57 16.22 1.75 15.88 1.59 15.38C1.42 14.89 1.9 14.13 2.12 13.56C2.35 13 2.95 12.52 2.95 12C2.95 11.48 2.35 11 2.12 10.44C1.9 9.87 1.42 9.11 1.59 8.62C1.75 8.12 2.57 7.78 3.09 7.46C3.61 7.14 4.37 7.1 4.68 6.68C4.98 6.26 4.78 5.52 4.93 4.93C5.08 4.34 5.14 3.45 5.56 3.14C5.99 2.83 6.85 3.05 7.46 3.09C8.07 3.13 8.71 3.55 9.2 3.39C9.7 3.23 9.97 2.51 10.44 2.12C10.9 1.73 11.48 1.05 12 1.05Z"></path><path class="sef-tik-isaret" fill="none" d="M7.6 12.3l3 3 5.8-6"></path></svg>';

/** parcalar.topluluk.avatar-ic: fotoğraf varsa görsel + gizli baş harf (yüklenemezse harfe düşer), yoksa harf. */
function avatarIc(sef, o, { harfYalin = false } = {}) {
  const h = e(o, basHarf(sef));
  if (sef.avatar) return `<img src="${e(o, sef.avatar)}" alt="" loading="lazy" decoding="async" data-avatar-gorsel=""><span data-avatar-harf="" hidden="" aria-hidden="true">${h}</span>`;
  return harfYalin ? `<span>${h}</span>` : `<span>${h}</span>`;
}
const dogrulanmisRozet = (sef, o) => `<em class="hub-chef-card__verified" role="img" aria-label="${e(o, sef.unvan)}" title="${e(o, sef.unvan)}">${SEF_TIK}</em>`;
/** Takip düğmesi: donörün formu (onclick stopPropagation, kart tıklaması yönlendirmesin) — POST yok, durum bellekte. */
const takipFormu = (sinif, k, sef, o) => `<form onclick="event.stopPropagation()"><button class="${sinif}" aria-pressed="false" type="button" data-vd-takip="${e(o, k)}" data-ad="${e(o, sef.ad)}" data-etiket-acik="Takip Ediliyor" data-etiket-kapali="+ Takip Et">+ Takip Et</button></form>`;
const tarifMetni = (n) => `${Number(n || 0).toLocaleString('tr-TR')} tarif`;

/**
 * Gastro şef kartı.
 * @param {string} k   şef kullanıcı adı (SEF anahtarı)
 * @param {object} o   build ortak nesnesi (SEF, sefAdresi, esc)
 * @param {{tur?: 'dizin'|'usta'}} secenek
 */
export function sefKarti(k, o, { tur = 'dizin' } = {}) {
  const sef = o.SEF?.[k];
  if (!sef) return '';
  const adres = o.sefAdresi ? o.sefAdresi(k) : `video-sef-${String(k).replace(/\./g, '-')}.html`;
  const dogru = dogrulanmisMi(sef);
  if (tur === 'usta') {
    // donör: / "Tarifin ustaları" .chef-card
    return `<div class="chef-card${dogru ? ' sef-editor' : ''}" onclick="${onclickAdres(adres)}">
                        <div class="chef-av gastro-sef-avatar${dogru ? ' sef-imza' : ''}">
    ${avatarIc(sef, o)}${dogru ? `    ${dogrulanmisRozet(sef, o)}` : ''}</div>
                        <b>${e(o, sef.ad)}</b>
                        <span>${tarifMetni(sef.tarif_sayisi)}</span>
                        ${takipFormu('chef-follow', k, sef, o)}
                    </div>`;
  }
  // donör: /sefler .sef-card
  const sira = KADEME_SIRA[sef.unvan];
  const ust = (sira || 0) >= 6;
  const unvan = dogru
    ? `<span class="sef-unvan"><i class="fa-solid fa-award" aria-hidden="true"></i> ${e(o, sef.unvan)}</span>`
    : sira ? `<span class="sef-rank${ust ? ' r-high' : ''}"><i class="fa-solid ${ust ? 'fa-trophy' : 'fa-medal'}" aria-hidden="true"></i> ${e(o, sef.unvan)}</span>`
      : sef.unvan ? `<span class="sef-rank">${e(o, sef.unvan)}</span>` : '';
  return `<article class="sef-card ${dogru ? ' sef-editor' : ''}" onclick="${onclickAdres(adres)}">
<div class="sef-ava${dogru ? ' sef-imza' : ''}">
${dogru ? avatarIc(sef, o) : avatarIc(sef, o, { harfYalin: true })}${dogru ? dogrulanmisRozet(sef, o) : ''}
</div>
                        <div class="sef-name">
                            ${e(o, sef.ad)}
                        </div>
${unvan}
<div class="sef-meta">
                            <span class="it"><i class="fa-solid fa-book-open" aria-hidden="true"></i> ${tarifMetni(sef.tarif_sayisi)}</span>
</div>
                        <div class="sef-foot">
                            ${takipFormu('sef-follow', k, sef, o)}
                        </div>
</article>`;
}

/** Donörün kapları: ızgara `/sefler #sefGrid.sef-grid` · ray `/ .chef-row.drag-scroll`. */
export const sefIzgarasi = (kler, o) => `<div class="sef-grid">${kler.map((k) => sefKarti(k, o, { tur: 'dizin' })).join('\n')}</div>`;
export const sefRayi = (kler, o) => `<div class="chef-row drag-scroll">${kler.map((k) => sefKarti(k, o, { tur: 'usta' })).join('\n')}</div>`;
