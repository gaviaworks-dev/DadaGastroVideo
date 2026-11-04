# Video prototipi verisi: veri/katalog.json'daki (lead) tarif slug'ları ve şefler için yerel Gastro dev MySQL'inden
# (gastro_v2_video) SALT OKUMA (yalnız SELECT) ile veri/tarifler.json ve veri/sefler.json üretir; kapakları yerel kopyadan
# (gastro-mysql/public/varliklar/media) cwebp ile varlik/video/tarif/<slug>-640.webp ve -1600.webp olarak hazırlar.
# Canlı siteye istek atılmaz. E-posta, telefon gibi kişisel alanlar okunmaz.
#
# Kullanım: python3 -I araclar/veri-hazirla.py
#   MYSQL_SARMAL (varsayılan ~/.mysql84/gastro-app.sh) · VT (varsayılan gastro_v2_video) · GASTRO_KOK (varsayılan …/gastro-mysql)
import json, os, re, subprocess, sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SARMAL = os.environ.get('MYSQL_SARMAL', os.path.expanduser('~/.mysql84/gastro-app.sh'))
VT = os.environ.get('VT', 'gastro_v2_video')
GASTRO = os.environ.get('GASTRO_KOK', os.path.expanduser('~/Developer/Revenge Projects/DadaMentor/gastro-mysql'))
SEF_SAYISI_ORNEK = 6  # şef sayfası için şefin en çok görüntülenen yayındaki tarifleri (yalnız sıralama; sayı basılmaz)

def _coz(h):
    if h == 'NULL': return None
    return re.sub(r'\\(.)', lambda m: {'n': '\n', 't': '\t', '0': '\0', '\\': '\\'}.get(m.group(1), m.group(1)), h)

def sorgu(sql):
    if not re.match(r'^\s*select\b', sql, re.I): raise SystemExit('yalnız SELECT')
    cikti = subprocess.run([SARMAL, VT, '-B', '-e', sql], capture_output=True, text=True, check=True).stdout
    satirlar = cikti.rstrip('\n').split('\n') if cikti.strip() else []
    if not satirlar: return []
    basl = satirlar[0].split('\t')
    return [dict(zip(basl, [_coz(x) for x in s.split('\t')])) for s in satirlar[1:]]

def lit(s): return "'" + str(s).replace('\\', '\\\\').replace("'", "''") + "'"
def sayi(x):
    if x is None: return None
    f = float(x); return int(f) if f.is_integer() else f
def miktar_metin(x):
    if x is None: return ''
    f = float(x)
    kesir = {0.25: '¼', 0.5: '½', 0.75: '¾', 0.33: '⅓', 0.67: '⅔'}
    tam, ond = int(f), round(f - int(f), 2)
    if ond in kesir: return (f'{tam} ' if tam else '') + kesir[ond]
    return str(int(f)) if f.is_integer() else (f'{f:.2f}'.rstrip('0').rstrip('.').replace('.', ','))

with open(os.path.join(KOK, 'veri', 'katalog.json'), encoding='utf-8') as f: K = json.load(f)
SAYFALI = {v['tarif'] for v in K.get('videolar', []) + K.get('kisalar', []) if v.get('tarif')}   # tarif-<slug>.html üretilir
POSTER = {v['poster_tarif'] for v in K.get('videolar', []) + K.get('kisalar', []) if v.get('poster_tarif')} - SAYFALI  # yalnız kapak
SLUGLAR = sorted(SAYFALI | POSTER)
SERI_SEF = {s['sef'] for s in K.get('seriler', []) if s.get('sef')}
UZUN = {v['tarif'] for v in K.get('videolar', []) if v.get('tarif')}
KISA = {v['tarif'] for v in K.get('kisalar', []) if v.get('tarif')}

eksen_ad = {r['id']: r['ad'] for r in sorgu('select id, ad from eksen_degerleri')}
tar = sorgu(f"""select t.id, t.slug, t.baslik, t.alt_baslik, t.ozet, t.kapak_url, t.hazirlik_dk, t.pisirme_dk, t.zorluk_id, t.mutfak_id,
  t.porsiyon_sayisi, t.porsiyon_birimi, t.sef_id, t.durum, up.kullanici_adi sef from tarifler t left join uye_profilleri up on up.id = t.sef_id
  where t.slug in ({','.join(lit(s) for s in SLUGLAR)}) and t.deleted_at is null""")
bulunan = {t['slug'] for t in tar}
eksik = [s for s in SLUGLAR if s not in bulunan]
if eksik: print('✗ katalogda olup veritabanında olmayan tarif:', ', '.join(eksik), file=sys.stderr)
ids = ','.join(t['id'] for t in tar) or '0'

malz = {}
for r in sorgu(f"""select tm.tarif_id, tm.grup_basligi, tm.sira, tm.miktar, tm.olcu_birimi_slug, coalesce(ob.kisa_ad, ob.ad, tm.olcu_birimi_slug) birim,
  coalesce(m.ad, tm.serbest_ad) ad, tm.aciklama, tm.malzeme_id from tarif_malzemeleri tm left join olcu_birimleri ob on ob.id = tm.olcu_birimi_id
  left join malzemeler m on m.id = tm.malzeme_id where tm.tarif_id in ({ids}) order by tm.tarif_id, tm.grup_basligi is not null, tm.sira"""):
    malz.setdefault(r['tarif_id'], []).append({'miktar': sayi(r['miktar']), 'miktar_metin': miktar_metin(r['miktar']), 'birim': r['birim'] or '',
        'ad': (r['ad'] or '').strip(), 'aciklama': (r['aciklama'] or '').strip(), 'grup': r['grup_basligi'] or None,
        'malzeme_id': int(r['malzeme_id']) if r['malzeme_id'] else None})
for l in malz.values(): l.sort(key=lambda x: 0)  # sıra korunur (sorgu sırası)

adim = {}
for r in sorgu(f"select tarif_id, sira, baslik, metin, sure_dk from tarif_adimlari where tarif_id in ({ids}) and coalesce(pasif_mi, 0) = 0 order by tarif_id, sira"):
    adim.setdefault(r['tarif_id'], []).append({'baslik': (r['baslik'] or '').strip(), 'metin': (r['metin'] or '').strip(), 'sure_dk': sayi(r['sure_dk'])})

besin = {r['tarif_id']: r for r in sorgu(f"select tarif_id, kalori, porsiyon_basi, hesaplanabildi from tarif_besin_degerleri where tarif_id in ({ids})")}

def kapak(slug): return {'kapak640': f'varlik/video/tarif/{slug}-640.webp', 'kapak1600': f'varlik/video/tarif/{slug}-1600.webp'}

tarifler = {}
for t in sorted(tar, key=lambda x: x['slug']):
    b = besin.get(t['id'])
    kalori = sayi(b['kalori']) if b and b['hesaplanabildi'] == '1' and b['porsiyon_basi'] == '1' and b['kalori'] else None
    tarifler[t['slug']] = {
        'slug': t['slug'], 'baslik': t['baslik'], 'alt_baslik': t['alt_baslik'], 'ozet': t['ozet'], 'durum': t['durum'],
        'sayfa': t['slug'] in SAYFALI,  # False = yalnız poster kaynağı (tarifsiz videonun görseli); prototipte tarif sayfası yok
        **kapak(t['slug']), 'kapak_kaynak': t['kapak_url'],
        'hazirlik_dk': sayi(t['hazirlik_dk']), 'pisirme_dk': sayi(t['pisirme_dk']),
        'zorluk': eksen_ad.get(t['zorluk_id']), 'mutfak': eksen_ad.get(t['mutfak_id']),
        'porsiyon': sayi(t['porsiyon_sayisi']), 'porsiyon_birimi': t['porsiyon_birimi'],
        'kalori': kalori, 'malzemeler': malz.get(t['id'], []), 'adimlar': adim.get(t['id'], []), 'sef': t['sef'],
    }

# ---------- Şefler: seri şefleri + katalog tariflerinin şefleri ----------
SEFLER = sorted(SERI_SEF | {t['sef'] for t in tar if t['sef']})
prof = sorgu(f"""select up.id, up.kullanici_adi, up.unvan, up.avatar_url, k.ad, k.soyad from uye_profilleri up
  left join kimlik_hesaplar k on k.id = up.hesap_id where up.kullanici_adi in ({','.join(lit(s) for s in SEFLER)}) and up.deleted_at is null""")
pid = ','.join(p['id'] for p in prof) or '0'
sayim = {r['sef_id']: int(r['n']) for r in sorgu(f"select sef_id, count(*) n from tarifler where durum = 'yayinda' and deleted_at is null and sef_id in ({pid}) group by sef_id")}
mutfak = {}
for r in sorgu(f"""select sef_id, mutfak_id, count(*) n from tarifler where durum = 'yayinda' and deleted_at is null and mutfak_id is not null
  and sef_id in ({pid}) group by sef_id, mutfak_id order by sef_id, n desc, mutfak_id"""):
    mutfak.setdefault(r['sef_id'], eksen_ad.get(r['mutfak_id']))
ornek = {}
for p in prof:
    if p['kullanici_adi'] not in SERI_SEF: continue  # şef sayfası yalnız seri şefleri için (video-sef-*)
    ornek[p['id']] = [{'slug': r['slug'], 'baslik': r['baslik'], 'kapak_kaynak': r['kapak_url'], 'kapak640': f"varlik/video/tarif/{r['slug']}-640.webp",
        'sure_dk': (sayi(r['hazirlik_dk']) or 0) + (sayi(r['pisirme_dk']) or 0) or None, 'zorluk': eksen_ad.get(r['zorluk_id'])}
        for r in sorgu(f"""select slug, baslik, kapak_url, hazirlik_dk, pisirme_dk, zorluk_id from tarifler where sef_id = {int(p['id'])} and durum = 'yayinda'
          and deleted_at is null and kapak_url like 'varliklar/media/%' order by goruntulenme desc, id limit 40""")
        if os.path.exists(os.path.join(GASTRO, 'public', r['kapak_url']))][:SEF_SAYISI_ORNEK]  # yerel kopyası olan kapaklar

def bas_harf(ad):
    p = [x for x in re.split(r'\s+', ad or '') if x]
    return ((p[0][0] + (p[-1][0] if len(p) > 1 else '')) if p else '?').upper().replace('İ', 'İ')

sefler = {}
for p in sorted(prof, key=lambda x: x['kullanici_adi']):
    ad = ' '.join(x for x in [p['ad'], p['soyad']] if x).strip() or p['kullanici_adi']
    av = p['avatar_url']
    # D3: foto yalnız berkan.gunes (veritabanında avatarı olan tek seri şefi); yerel kopya varlik/gastro/storage/... (snapshot)
    avatar = ('varlik/gastro' + av) if av and av.startswith('/storage/') and os.path.exists(os.path.join(KOK, 'varlik/gastro' + av)) else None
    if av and not avatar: print(f'· {p["kullanici_adi"]}: avatar yolu {av} yerelde yok → baş harf', file=sys.stderr)
    sefler[p['kullanici_adi']] = {'ad': ad, 'kullanici_adi': p['kullanici_adi'], 'unvan': p['unvan'], 'avatar': avatar, 'bas_harf': bas_harf(ad),
        'tarif_sayisi': sayim.get(p['id'], 0), 'mutfak': mutfak.get(p['id']),
        'tarifler': sorted(s for s, t in tarifler.items() if t['sef'] == p['kullanici_adi'] and t['sayfa']),
        'ornek_tarifler': ornek.get(p['id'], []), 'seri_sefi': p['kullanici_adi'] in SERI_SEF, 'gastro_profil': f"https://dadagastro.com/sefler/{p['kullanici_adi']}"}
for s in SEFLER:
    if s not in sefler: print('✗ şef bulunamadı:', s, file=sys.stderr)

# ---------- Kapaklar (yerel kopya → webp) ----------
os.makedirs(os.path.join(KOK, 'varlik/video/tarif'), exist_ok=True)
yeni = 0; eksik_gorsel = []
def uret(kaynak_url, hedef, gen):
    global yeni
    h = os.path.join(KOK, hedef)
    if os.path.exists(h): return True
    k = os.path.join(GASTRO, 'public', kaynak_url or '')
    if not kaynak_url or not os.path.exists(k): eksik_gorsel.append(f'{hedef} ← {kaynak_url}'); return False
    subprocess.run(['cwebp', '-quiet', '-q', '78' if gen == 1600 else '76', '-resize', str(gen), '0', k, '-o', h], check=True); yeni += 1; return True
for s, t in tarifler.items():
    uret(t['kapak_kaynak'], t['kapak640'], 640)
    uret(t['kapak_kaynak'], t['kapak1600'], 1600)  # oynatıcı posteri (uzun) ve tam ekran dikey görüntüleyici (kısa) için
for sf in sefler.values():
    for o in sf['ornek_tarifler']:
        if not uret(o['kapak_kaynak'], o['kapak640'], 640): o['kapak640'] = None

# kullanılmayan eski kapaklar (önceki koşumlardan) — yalnız bu betiğin kendi klasöründe, yalnız .webp
kullanilan = {os.path.basename(t[k]) for t in tarifler.values() for k in ('kapak640', 'kapak1600')} | {os.path.basename(o['kapak640']) for sf in sefler.values() for o in sf['ornek_tarifler'] if o['kapak640']}
kd = os.path.realpath(os.path.join(KOK, 'varlik/video/tarif'))
silinen = 0
for f in os.listdir(kd):
    if f.endswith('.webp') and f not in kullanilan: os.remove(os.path.join(kd, f)); silinen += 1
if silinen: print('kullanılmayan kapak silindi:', silinen)

os.makedirs(os.path.join(KOK, 'veri'), exist_ok=True)
not_ = f'{VT} (yerel dev MySQL, salt okuma) · araclar/veri-hazirla.py · tarifler.sef_id = uye_profilleri.id'
with open(os.path.join(KOK, 'veri', 'tarifler.json'), 'w', encoding='utf-8') as f:
    json.dump({'_kaynak': not_, 'tarifler': tarifler}, f, ensure_ascii=False, indent=1)
with open(os.path.join(KOK, 'veri', 'sefler.json'), 'w', encoding='utf-8') as f:
    json.dump({'_kaynak': not_, 'sefler': sefler}, f, ensure_ascii=False, indent=1)
print(f'tarif {len(tarifler)}/{len(SLUGLAR)} · kalorili {sum(1 for t in tarifler.values() if t["kalori"])} · şef {len(sefler)}/{len(SEFLER)} · yeni görsel {yeni} · eksik görsel {len(eksik_gorsel)}')
for e in eksik_gorsel: print('  ✗', e, file=sys.stderr)
if eksik or eksik_gorsel: sys.exit(2)
