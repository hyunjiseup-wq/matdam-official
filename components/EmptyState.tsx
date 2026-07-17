import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BrandIcon from '@/components/BrandIcon';

interface Props {
  title?: string;
  subtitle?: string;
}

export default function EmptyState({
  title = '맛집이 없어요',
  subtitle = '새로운 맛집을 추가해 보세요!',
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <BrandIcon name="bowl" size={34} color="#FF7A45" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF0E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#333' },
  subtitle: { fontSize: 14, color: '#999' },
});
