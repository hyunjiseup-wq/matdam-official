import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BrandIcon, { BrandIconName } from '@/components/BrandIcon';
import ChipRow from '@/components/ChipRow';
import {
  CATEGORIES,
  PROVINCES,
  inferDistrictFromAddress,
  inferProvinceFromAddress,
} from '@/constants/filters';
import { useRestaurants } from '@/context/RestaurantContext';
import { VisitedFilter } from '@/types/restaurant';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}

function Chip({ label, active, onPress, activeColor = '#FF7A45' }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const STATUS_OPTIONS: { label: string; value: VisitedFilter; color: string; icon?: BrandIconName }[] = [
  { label: '전체', value: 'all', color: '#888' },
  { label: '가고싶음', value: 'wishlist', color: '#FF7A45', icon: 'heart' },
  { label: '방문함', value: 'visited', color: '#00B894', icon: 'check' },
];

export default function FilterBar() {
  const {
    restaurants,
    provinceFilter,
    areaFilter,
    categoryFilter,
    visitedFilter,
    setProvinceFilter,
    setAreaFilter,
    setCategoryFilter,
    setVisitedFilter,
  } = useRestaurants();

  // 데이터에 존재하는 시/도만 노출
  const provinces = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      const p = inferProvinceFromAddress(r.address);
      if (p) set.add(p);
    });
    return PROVINCES.filter((p) => set.has(p));
  }, [restaurants]);

  // 선택한 시/도 안의 구 목록
  const districts = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => {
      if (provinceFilter && !(r.address ?? '').includes(provinceFilter)) return;
      const d = inferDistrictFromAddress(r.address);
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [restaurants, provinceFilter]);

  return (
    <View>
      {/* 시/도 */}
      <ChipRow style={styles.row}>
        <Chip
          label="전체 지역"
          active={provinceFilter === null}
          onPress={() => {
            setProvinceFilter(null);
            setAreaFilter(null);
          }}
        />
        {provinces.map((p) => (
          <Chip
            key={p}
            label={p}
            active={provinceFilter === p}
            onPress={() => {
              setProvinceFilter(provinceFilter === p ? null : p);
              setAreaFilter(null);
            }}
          />
        ))}
      </ChipRow>

      {/* 구 (시/도 선택 시 노출) */}
      {provinceFilter && districts.length > 0 && (
        <ChipRow style={styles.subRow}>
          <Chip
            label={`${provinceFilter} 전체`}
            active={areaFilter === null}
            onPress={() => setAreaFilter(null)}
            activeColor="#E17055"
          />
          {districts.map((d) => (
            <Chip
              key={d}
              label={d}
              active={areaFilter === d}
              onPress={() => setAreaFilter(areaFilter === d ? null : d)}
              activeColor="#E17055"
            />
          ))}
        </ChipRow>
      )}

      {/* 카테고리 */}
      <ChipRow style={styles.row}>
        <Chip
          label="전체 카테고리"
          active={categoryFilter === null}
          onPress={() => setCategoryFilter(null)}
          activeColor="#6C5CE7"
        />
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            active={categoryFilter === cat}
            onPress={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            activeColor="#6C5CE7"
          />
        ))}
      </ChipRow>

      {/* 상태 */}
      <View style={styles.visitedRow}>
        {STATUS_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setVisitedFilter(opt.value)}
            style={[
              styles.visitedChip,
              visitedFilter === opt.value && { backgroundColor: opt.color, borderColor: opt.color },
            ]}
          >
            {opt.icon && (
              <BrandIcon
                name={opt.icon}
                size={12}
                color={visitedFilter === opt.value ? '#fff' : opt.color}
              />
            )}
            <Text style={[styles.visitedText, visitedFilter === opt.value && styles.visitedTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 4, gap: 8, flexDirection: 'row', alignItems: 'center' },
  subRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  visitedRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 6, gap: 8 },
  visitedChip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  visitedText: { fontSize: 13, color: '#555' },
  visitedTextActive: { color: '#fff', fontWeight: '600' },
});
