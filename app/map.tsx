// 지도 화면 — 플랫폼별 구현은 components/RestaurantMap 에서 분기
// (웹: Leaflet+OSM / 네이티브: react-native-maps)
import React from 'react';
import RestaurantMap from '@/components/RestaurantMap';

export default function MapScreen() {
  return <RestaurantMap />;
}
