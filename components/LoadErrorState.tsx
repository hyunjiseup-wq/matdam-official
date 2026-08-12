import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  onRetry: () => void;
  title?: string;
  message?: string;
}

export default function LoadErrorState({
  onRetry,
  title = '내용을 불러오지 못했어요',
  message = '인터넷 연결을 확인하고 다시 시도해주세요.',
}: Props) {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-offline-outline" size={34} color="#D45B2A" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="다시 시도"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Ionicons name="refresh" size={17} color="#fff" />
        <Text style={styles.retryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E9',
    marginBottom: 6,
  },
  title: { fontSize: 17, fontWeight: '800', color: '#333', textAlign: 'center' },
  message: { fontSize: 13, lineHeight: 19, color: '#888', textAlign: 'center' },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#FF7A45',
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 10,
  },
  pressed: { opacity: 0.85 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
