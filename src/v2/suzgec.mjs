// V2 · Ortak liste süzgeci (hub ajanı; Patron revizesi 5 Kas, K1–K2). Bütün video liste sayfaları bunu çağırır.
// donör: yerel Gastro http://127.0.0.1:8960/tarifler (JS koşmuş render DOM, 5 Kas) — `section.lst-sec > .wrap > .lst-layout`:
//   aside.lst-side#lstSide > .sheet-head(h3 "Filtrele" · .sh-right > a.fil-clear "Temizle" + button.sheet-close#sheetClose)
//     + form > .sheet-body(.fil-top h3 "Filtreler" · .fct.open[data-group] > button.fct-head(i.fct-head-ico · ad · span.fct-dot · i.fct-car)
//       + .fct-body > label.fct-row[.xtra](input[type=checkbox] · span.cbx · span.ft · span.fcnt)* + button.fct-more) + .sheet-foot(a.fil-clear)
//   + div.sheet-overlay#sheetOverlay
//   + div.lst-main > .lst-bar(p.lst-sum#lstSum "<b>N tarif</b> bulundu" · .lst-tools(button.btn-filter#btnFilter + span.fb-count#filCount ·
//       .sort-dd#sortDd > button.sort-btn#sortBtn(i · span.sb-lbl "Sıralama:" · span#sortCur · i.sb-car) + .sort-menu[role=menu] > a.active*))
//     + .bos-durum(h3 · p · a.dugme.ikincil) (donör: /tarifler?q=<sonuçsuz>) + .lst-grid#lstGrid
// CSS: tarif-liste.css · revize/p1/tarifler.css · shared/dm-p4-f.css (kabuk, sayfa bayrağı `suzgec: true`) + varlik/v2/css/suzgec.css
// (yalnız `.bos-durum`/`.dugme.ikincil` — kanon bilesenler.css global sıfırlama taşıdığı için yüklenmez; ölçülen değerler).
// Donörden ayrılanlar: form GET yerine istemci tarafı (seçim adres sorgusuna yazılır, tarayıcıya kayıt yok); sıralama öğeleri <a> yerine
// <button> (sayfa yenilenmez); "Tema & pişirme tipi" şeridi, görünüm anahtarı ve sayfalama yok (video listeleri kısa; arşiv kaydırdıkça yüklenir).
// Davranış: varlik/v2/js/suzgec.js (window.vdSuzgec). API tasks/hub-durum.md "SÜZGEÇ".

const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ik = (ad, sinif = '') => `<i class="fa-solid ${ad}${sinif ? ' ' + sinif : ''}" aria-hidden="true"></i>`;
/** Türkçe güvenli kod: "Türk Mutfağı" → "turk-mutfagi" */
export const szKod = (ad) => String(ad || '').toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Liste öğesinin süzgeç öznitelikleri: alanlar { kod: [deger…] } · siralar { kod: deger } → ' data-sz-oge data-sz-<kod>="…" data-sz-sira-<kod>="…"' */
export function szVeri(alanlar = {}, siralar = {}, dizin = 0) {
  const a = Object.entries(alanlar).map(([k, v]) => ` data-sz-${k}="${esc([...new Set((Array.isArray(v) ? v : [v]).filter(Boolean))].join(' '))}"`).join('');
  const s = Object.entries(siralar).map(([k, v]) => ` data-sz-sira-${k}="${esc(v)}"`).join('');
  return ` data-sz-oge data-sz-dizin="${dizin}"${a}${s}`;
}

/**
 * suzgecDuzeni(ayar) → HTML (Gastro .lst-layout)
 * ayar: { dosya (Temizle bağı, JS kapalıyken de başa döner), birim ('video'|'seri'|'bölüm'…), toplam,
 *         gruplar: [{ kod, ad, ikon?, secenekler: [{ deger, ad, sayi }], gorunur? (varsayılan 8; fazlası .xtra + "N seçenek daha") }],
 *         siralar: [{ kod, ad, ikon, alan?, yon? ('artan'|'azalan'), tur? ('sayi'|'metin') }]  (ilk = varsayılan; alan yoksa doğal sıra),
 *         bos: { baslik, metin, dugme }, liste (HTML: içinde [data-sz-oge] öğeleri; kap [data-sz-liste]), ust? (lst-bar'ın üstü), id? }
 */
export function suzgecDuzeni({ dosya, birim = 'video', toplam = 0, gruplar = [], siralar = [], bos = {}, liste = '', ust = '', id = 'liste' }) {
  const grup = (g) => {
    const gorunur = g.gorunur || 8;
    const fazla = Math.max(0, g.secenekler.length - gorunur);
    const satir = (s, i) => `<label class="fct-row${i >= gorunur ? ' xtra' : ''}"> <input type="checkbox" name="${esc(g.kod)}" value="${esc(s.deger)}" data-sz-secenek> <span class="cbx"></span> <span class="ft">${esc(s.ad)}</span> <span class="fcnt">${Number(s.sayi || 0).toLocaleString('tr-TR')}</span> </label>`;
    return `<div class="fct open" data-group="${esc(g.kod)}" data-sz-grup="${esc(g.kod)}">
        <button class="fct-head" type="button" aria-expanded="true" data-sz-akordeon>${g.ikon ? ` ${ik(g.ikon, 'fct-head-ico')}` : ''} ${esc(g.ad)} <span class="fct-dot" data-sz-nokta>0</span>${ik('fa-chevron-down', 'fct-car')}</button>
        <div class="fct-body">
          ${g.secenekler.map(satir).join('\n          ')}
          ${fazla ? `<button class="fct-more" type="button" data-more="${fazla} seçenek daha" data-less="Daha az göster" aria-expanded="false" data-sz-daha> ${fazla} seçenek daha ${ik('fa-chevron-down')}</button>` : ''}
        </div>
      </div>`;
  };
  const varsayilan = siralar[0];
  const siraDugme = (s, i) => `<button type="button" role="menuitem" class="${i === 0 ? 'active' : ''}" data-sz-sira="${esc(s.kod)}"${s.alan ? ` data-alan="${esc(s.alan)}" data-yon="${esc(s.yon || 'artan')}" data-tur="${esc(s.tur || 'sayi')}"` : ''}>${ik(s.ikon || 'fa-sort')} ${esc(s.ad)}</button>`;
  return `<div class="lst-layout vd-liste-suzgec" data-vd-suzgec="${esc(id)}" data-birim="${esc(birim)}" data-varsayilan-sira="${esc(varsayilan ? varsayilan.kod : '')}">
    <aside class="lst-side" id="lstSide" aria-label="Filtreler">
      <div class="sheet-head">
        <h3>${ik('fa-sliders')} Filtrele</h3>
        <div class="sh-right">
          <a class="fil-clear" href="${esc(dosya)}" data-sz-temizle>Temizle</a>
          <button class="sheet-close" id="sheetClose" type="button" aria-label="Filtre panelini kapat" data-sz-kapat>${ik('fa-xmark')}</button>
        </div>
      </div>
      <form data-sz-form action="${esc(dosya)}" method="get">
        <div class="sheet-body">
          <div class="fil-top"><h3>${ik('fa-sliders')} Filtreler</h3></div>
          ${gruplar.map(grup).join('\n          ')}
        </div>
        <div class="sheet-foot"><a class="fil-clear" data-f-ayak href="${esc(dosya)}" data-sz-temizle>Tümünü Temizle</a></div>
      </form>
    </aside>
    <div class="sheet-overlay" id="sheetOverlay" data-sz-ortu></div>
    <div class="lst-main">
      ${ust}
      <div class="lst-bar">
        <p class="lst-sum" id="lstSum" aria-live="polite"><b data-sz-sayi>${Number(toplam).toLocaleString('tr-TR')} ${esc(birim)}</b> bulundu</p>
        <div class="lst-tools">
          <button class="btn-filter" id="btnFilter" type="button" aria-controls="lstSide" aria-expanded="false" data-sz-ac>${ik('fa-sliders')} Filtrele <span class="fb-count" id="filCount" data-sz-secim hidden>0</span></button>
          ${siralar.length ? `<div class="sort-dd" id="sortDd" data-sz-sira-kok>
            <button class="sort-btn" id="sortBtn" type="button" aria-haspopup="true" aria-expanded="false">${ik('fa-arrow-down-wide-short')}<span class="sb-lbl">Sıralama:</span> <span id="sortCur" data-sz-sira-ad>${esc(varsayilan.ad)}</span>${ik('fa-chevron-down', 'sb-car')}</button>
            <div class="sort-menu" role="menu">${siralar.map(siraDugme).join('')}</div>
          </div>` : ''}
        </div>
      </div>
      <div class="bos-durum" data-sz-bos data-vd-bos hidden><h3>${esc(bos.baslik || 'Bu süzgeçlere uyan sonuç yok')}</h3><p data-vd-bos-alt>${esc(bos.metin || 'Seçimlerinden birini kaldırmayı ya da süzgeçleri temizlemeyi dene.')}</p><a class="dugme ikincil" href="${esc(dosya)}" data-sz-temizle data-vd-temizle>${esc(bos.dugme || 'Süzgeçleri temizle')}</a></div>
      ${liste}
    </div>
  </div>`;
}

/** Seçenek listesi: değer → { ad, sayi } (öğelerden sayılır), sıra: verilen sıra ya da sayıya göre azalan */
export function secenekler(ogeler, alan, adlar = {}, { sira = null, tum = null } = {}) {
  // tum: sabit seçenek listesi (ör. süre/zorluk) — öğelerde hiç geçmese de 0 sayıyla basılır (donör /tarifler 0 sayılı seçenekleri
  // normal satır olarak gösterir: kategori "Ana Yemek 0"); seçilince boş durum açılır.
  const say = new Map((tum || []).map((d) => [d, 0]));
  for (const x of ogeler) for (const d of new Set(x[alan] || [])) say.set(d, (say.get(d) || 0) + 1);
  let liste = [...say.entries()].map(([deger, sayi]) => ({ deger, ad: adlar[deger] || deger, sayi }));
  if (sira) liste.sort((a, b) => sira.indexOf(a.deger) - sira.indexOf(b.deger));
  else liste.sort((a, b) => b.sayi - a.sayi || String(a.ad).localeCompare(String(b.ad), 'tr'));
  return liste;
}
