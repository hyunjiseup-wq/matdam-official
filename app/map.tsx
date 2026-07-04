import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_COLORS } from '@/constants/filters';
import { useRestaurants } from '@/context/RestaurantContext';
import { DiscoverItem } from '@/types/restaurant';

// Leaflet + OpenStreetMap (무료, API 키 불필요) — 웹 전용
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.L) return resolve(w.L);
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve((window as any).L));
      return;
    }
    const s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.onload = () => resolve((window as any).L);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function MapScreen() {
  const router = useRouter();
  const { getDiscoverFeed } = useRestaurants();
  const containerRef = useRef<View>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState(0);
  const [missing, setMissing] = useState(0);

  const openDetail = useCallback(
    (id: string) => router.push(`/detail/${id}` as any),
    [router],
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let disposed = false;

    (async () => {
      try {
        const [L, feed] = await Promise.all([loadLeaflet(), getDiscoverFeed()]);
        if (disposed) return;

        const el = containerRef.current as unknown as HTMLElement | null;
        if (!el) return;

        const withCoords = feed.filter(
          (it): it is DiscoverItem & { lat: number; lng: number } =>
            it.lat != null && it.lng != null,
        );
        setShown(withCoords.length);
        setMissing(feed.length - withCoords.length);

        const map = L.map(el, { zoomControl: true }).setView([37.5665, 126.978], 12);
        mapRef.current = map;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const bounds: [number, number][] = [];
        for (const it of withCoords) {
          const color = (it.category && CATEGORY_COLORS[it.category]) || '#FF7A45';
          const marker = L.circleMarker([it.lat, it.lng], {
            radius: 8,
            color: '#ffffff',
            weight: 2,
            fillColor: color,
            fillOpacity: 0.95,
          }).addTo(map);

          // 팝업: 사진 + 이름 + 정보 + 상세 버튼
          const div = document.createElement('div');
          div.style.cssText = 'width:170px;font-family:sans-serif;';
          div.innerHTML =
            (it.image_url
              ? `<img src="${it.image_url}" style="width:100%;height:80px;object-fit:cover;border-radius:8px;margin-bottom:6px;" />`
              : '') +
            `<div style="font-weight:700;font-size:14px;margin-bottom:2px;">${it.name}</div>` +
            `<div style="font-size:12px;color:#888;">${[it.category, it.area, it.price_range ? '💰 ' + it.price_range : '']
              .filter(Boolean)
              .join(' · ')}</div>` +
            `<div style="font-size:12px;color:#FF7A45;margin:3px 0 6px;">🔥 ${it.addedCount}명 담음${
              it.avgRating > 0 ? ' · ★ ' + it.avgRating.toFixed(1) : ''
            }</div>`;
          const btn = document.createElement('button');
          btn.textContent = '상세 보기 →';
          btn.style.cssText =
            'width:100%;padding:6px 0;border:none;border-radius:8px;background:#FF7A45;color:#fff;font-weight:700;cursor:pointer;font-size:13px;';
          btn.onclick = () => openDetail(it.representativeId);
          div.appendChild(btn);
          marker.bindPopup(div);
          bounds.push([it.lat, it.lng]);
        }

        if (bounds.length > 0) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });

        // 내 위치 표시 (동의 시)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (disposed || !mapRef.current) return;
              L.circleMarker([pos.coords.latitude, pos.coords.longitude], {
                radius: 7,
                color: '#fff',
                weight: 2,
                fillColor: '#0984E3',
                fillOpacity: 1,
              })
                .addTo(mapRef.current)
                .bindPopup('📍 내 위치');
            },
            () => {},
            { timeout: 5000 },
          );
        }
      } catch {
        // 지도 로드 실패는 조용히 (아래 로딩 표시 유지 방지 위해 finally에서 해제)
      } finally {
        if (!disposed) setLoading(false);
      }
    })();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [getDiscoverFeed, openDetail]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 40 }}>🗺️</Text>
        <Text style={styles.nativeTitle}>지도는 웹에서 이용할 수 있어요</Text>
        <Text style={styles.nativeSub}>matdam-official.vercel.app 에 접속해보세요</Text>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <View ref={containerRef} style={styles.map} />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF7A45" />
        </View>
      )}
      {!loading && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            🍽️ {shown}곳 표시{missing > 0 ? ` (좌표 없는 ${missing}곳 제외)` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 30 },
  map: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,245,245,0.7)',
  },
  countBadge: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  countText: { fontSize: 13, fontWeight: '600', color: '#333' },
  nativeTitle: { fontSize: 17, fontWeight: '700', color: '#444' },
  nativeSub: { fontSize: 13, color: '#999' },
});
