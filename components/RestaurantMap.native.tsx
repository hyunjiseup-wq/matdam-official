// 네이티브 지도: react-native-maps (iOS=Apple 지도 키 불필요, Android=Google 지도 API 키 필요)
// 웹은 RestaurantMap.tsx (Leaflet)가 대신 로드된다.
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import BrandIcon from '@/components/BrandIcon';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { CATEGORY_COLORS } from '@/constants/filters';
import { useRestaurants } from '@/context/RestaurantContext';
import { DiscoverItem } from '@/types/restaurant';

type MapItem = DiscoverItem & { lat: number; lng: number };

const SEOUL = { latitude: 37.5665, longitude: 126.978, latitudeDelta: 0.35, longitudeDelta: 0.35 };

export default function RestaurantMap() {
  const router = useRouter();
  const { getDiscoverFeed } = useRestaurants();
  const mapRef = useRef<MapView>(null);
  const [items, setItems] = useState<MapItem[]>([]);
  const [missing, setMissing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMyLocation, setShowMyLocation] = useState(false);

  const openDetail = useCallback(
    (id: string) => router.push(`/detail/${id}` as any),
    [router],
  );

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const feed = await getDiscoverFeed();
        if (disposed) return;
        const withCoords = feed.filter(
          (it): it is MapItem => it.lat != null && it.lng != null,
        );
        setItems(withCoords);
        setMissing(feed.length - withCoords.length);
      } catch {
        // 로드 실패 시 빈 지도 유지
      } finally {
        if (!disposed) setLoading(false);
      }

      // 내 위치 표시 (동의 시) — 거부해도 지도는 그대로 사용 가능
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!disposed && status === 'granted') setShowMyLocation(true);
      } catch {}
    })();
    return () => {
      disposed = true;
    };
  }, [getDiscoverFeed]);

  // 마커가 모두 보이도록 화면 맞추기
  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        items.map((it) => ({ latitude: it.lat, longitude: it.lng })),
        { edgePadding: { top: 60, right: 60, bottom: 80, left: 60 }, animated: false },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [items]);

  return (
    <View style={styles.safe}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={SEOUL}
        showsUserLocation={showMyLocation}
        showsMyLocationButton={showMyLocation}
        toolbarEnabled={false}
      >
        {items.map((it) => {
          const color = (it.category && CATEGORY_COLORS[it.category]) || '#FF7A45';
          return (
            <Marker
              key={it.representativeId}
              coordinate={{ latitude: it.lat, longitude: it.lng }}
              tracksViewChanges={false}
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Callout onPress={() => openDetail(it.representativeId)}>
                <View style={styles.callout}>
                  <Text style={styles.calloutName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.calloutInfo} numberOfLines={1}>
                    {[it.category, it.area, it.price_range]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <View style={styles.calloutHotRow}>
                    <BrandIcon name="fire" size={11} color="#FF7A45" />
                    <Text style={styles.calloutHot}>
                      {it.addedCount}명 담음{it.avgRating > 0 ? ` · ${it.avgRating.toFixed(1)}점` : ''}
                    </Text>
                  </View>
                  <Text style={styles.calloutBtn}>상세 보기 →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF7A45" />
        </View>
      )}
      {!loading && (
        <View style={styles.countBadge}>
          <BrandIcon name="bowl" size={13} color="#FF7A45" />
          <Text style={styles.countText}>
            {items.length}곳 표시{missing > 0 ? ` (좌표 없는 ${missing}곳 제외)` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  map: { flex: 1 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  callout: { width: 190, paddingVertical: 2 },
  calloutName: { fontWeight: '700', fontSize: 14, marginBottom: 2, color: '#333' },
  calloutInfo: { fontSize: 12, color: '#888' },
  calloutHot: { fontSize: 12, color: '#FF7A45', marginTop: 3 },
  calloutHotRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  calloutBtn: {
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: '#FF7A45',
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,245,245,0.7)',
  },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 5,
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  countText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
});
