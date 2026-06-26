// =============================================================
// 맛담 - 대표 사진 백필 스크립트 (구글 Places API → Supabase Storage)
//
// 사진이 없는(image_url IS NULL) 맛집을 대상으로:
//   1) 구글 Places(신규) Text Search로 가게 검색 → 대표 사진 1장
//   2) 사진을 Supabase Storage(restaurant-photos)에 저장
//   3) seoul_restaurants.image_url 을 영구 공개 URL로 업데이트
//
// 실행 (PowerShell):
//   $env:SUPABASE_URL="https://feyqayuwfjgzdsazullv.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role 키>"
//   $env:GOOGLE_API_KEY="<구글 API 키>"
//   node scripts/backfill-photos.mjs
//
// 일부만 테스트하려면:  node scripts/backfill-photos.mjs 10   (앞 10곳만)
// =============================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY;
const LIMIT = process.argv[2] ? parseInt(process.argv[2], 10) : Infinity;

if (!SUPABASE_URL || !SERVICE_KEY || !GOOGLE_KEY) {
  console.error('환경변수 필요: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
const BUCKET = 'restaurant-photos';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 구글 Places(신규) Text Search → 첫 결과의 사진 resource name
async function findPhotoName(name, address) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.photos',
    },
    body: JSON.stringify({
      textQuery: `${name} ${address ?? ''}`.trim(),
      languageCode: 'ko',
      regionCode: 'KR',
      maxResultCount: 1,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`searchText ${res.status}: ${t.slice(0, 120)}`);
  }
  const j = await res.json();
  const place = j.places?.[0];
  return place?.photos?.[0]?.name ?? null; // 예: places/XXX/photos/YYY
}

// 사진 resource name → 실제 이미지 바이트
async function downloadPhoto(photoName) {
  const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${GOOGLE_KEY}`;
  const res = await fetch(url); // 실제 이미지로 리다이렉트 → fetch가 따라감
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buf, contentType };
}

async function main() {
  const { data: rows, error } = await supabase
    .from('seoul_restaurants')
    .select('id, name, address, image_url')
    .is('image_url', null)
    .order('priority', { ascending: false });

  if (error) {
    console.error('DB 조회 실패:', error.message);
    process.exit(1);
  }

  const targets = rows.slice(0, LIMIT);
  console.log(`대상: ${targets.length}곳 (사진 없는 맛집)\n`);

  let ok = 0, notFound = 0, fail = 0;
  for (let i = 0; i < targets.length; i++) {
    const r = targets[i];
    const tag = `[${i + 1}/${targets.length}] ${r.name}`;
    try {
      const photoName = await findPhotoName(r.name, r.address);
      if (!photoName) {
        notFound++;
        console.log(`· ${tag} — 사진 없음/검색 실패`);
        await sleep(120);
        continue;
      }
      const photo = await downloadPhoto(photoName);
      if (!photo) {
        fail++;
        console.log(`✗ ${tag} — 다운로드 실패`);
        await sleep(120);
        continue;
      }
      const ext = photo.contentType.includes('png') ? 'png' : 'jpg';
      const path = `google/${r.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, photo.buf, { contentType: photo.contentType, upsert: true });
      if (upErr) {
        fail++;
        console.log(`✗ ${tag} — 업로드 실패: ${upErr.message}`);
        await sleep(120);
        continue;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updErr } = await supabase
        .from('seoul_restaurants')
        .update({ image_url: pub.publicUrl })
        .eq('id', r.id);
      if (updErr) {
        fail++;
        console.log(`✗ ${tag} — DB 업데이트 실패: ${updErr.message}`);
      } else {
        ok++;
        console.log(`✓ ${tag}`);
      }
    } catch (e) {
      fail++;
      console.log(`✗ ${tag} — ${e.message}`);
    }
    await sleep(150); // 호출 간 약간의 여유
  }

  console.log(`\n완료 → 성공 ${ok} · 검색실패 ${notFound} · 오류 ${fail}`);
}

main();
