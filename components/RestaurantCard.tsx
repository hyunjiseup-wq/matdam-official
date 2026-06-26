import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_BG, CATEGORY_COLORS } from '@/constants/filters';
import { Restaurant } from '@/types/restaurant';

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
  mode?: 'own' | 'browse';
  onToggleVisited?: () => void;
  onToggleWishlist?: () => void;
  onCopy?: () => void;
  copied?: boolean;
}

function Stars({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={12}
          color={i < count ? '#FDCB6E' : '#ccc'}
        />
      ))}
    </View>
  );
}

export default function RestaurantCard({
  restaurant,
  onPress,
  mode = 'own',
  onToggleVisited,
  onToggleWishlist,
  onCopy,
  copied,
}: Props) {
  const { name, area, category, memo, tags, priority, visited, wishlist, image_url, map_source } = restaurant;
  const catColor = category ? CATEGORY_COLORS[category] ?? '#888' : '#888';
  const catBg = category ? CATEGORY_BG[category] ?? '#f5f5f5' : '#f5f5f5';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.cardInner}>
        {/* 텍스트 영역 */}
        <View style={styles.textArea}>
          <View style={styles.topRow}>
            <View style={styles.badges}>
              {category && (
                <View style={[styles.badge, { backgroundColor: catBg }]}>
                  <Text style={[styles.badgeText, { color: catColor }]}>{category}</Text>
                </View>
              )}
              {area && (
                <View style={styles.areaBadge}>
                  <Text style={styles.areaBadgeText}>📍 {area}</Text>
                </View>
              )}
              {map_source && (
                <View
                  style={[
                    styles.mapBadge,
                    { backgroundColor: map_source === 'google' ? '#E8F0FE' : '#E6F8EE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.mapBadgeText,
                      { color: map_source === 'google' ? '#4285F4' : '#03C75A' },
                    ]}
                  >
                    {map_source === 'google' ? 'G' : 'N'}
                  </Text>
                </View>
              )}
            </View>
            <Stars count={priority} />
          </View>

          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>

          {memo ? (
            <Text style={styles.memo} numberOfLines={2}>
              {memo}
            </Text>
          ) : null}

          {tags && tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.slice(0, 3).map((tag, i) => (
                <Text key={i} style={styles.tag}>
                  #{tag}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* 음식 사진 썸네일 */}
        {image_url ? <Image source={{ uri: image_url }} style={styles.thumbnail} /> : null}
      </View>

      {/* 하단 액션 */}
      <View style={styles.bottomRow}>
        {mode === 'own' ? (
          <View style={styles.btnGroup}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onToggleWishlist?.();
              }}
              style={[styles.stateBtn, wishlist && styles.wishlistBtnActive]}
              hitSlop={4}
            >
              <Ionicons
                name={wishlist ? 'heart' : 'heart-outline'}
                size={15}
                color={wishlist ? '#fff' : '#aaa'}
              />
              <Text style={[styles.stateBtnText, wishlist && styles.activeText]}>가고싶음</Text>
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onToggleVisited?.();
              }}
              style={[styles.stateBtn, visited && styles.visitedBtnActive]}
              hitSlop={4}
            >
              <Ionicons
                name={visited ? 'checkmark-circle' : 'ellipse-outline'}
                size={15}
                color={visited ? '#fff' : '#aaa'}
              />
              <Text style={[styles.stateBtnText, visited && styles.activeText]}>방문함</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              if (!copied) onCopy?.();
            }}
            style={[styles.copyBtn, copied && styles.copyBtnDone]}
            hitSlop={4}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'download-outline'}
              size={15}
              color={copied ? '#00B894' : '#fff'}
            />
            <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
              {copied ? '담음' : '내 리스트에 담기'}
            </Text>
          </Pressable>
        )}
        <Ionicons name="chevron-forward" size={18} color="#ccc" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
  cardInner: { flexDirection: 'row', gap: 10 },
  textArea: { flex: 1 },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    flexShrink: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  areaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#f0f0f0' },
  areaBadgeText: { fontSize: 12, color: '#666' },
  mapBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  mapBadgeText: { fontSize: 12, fontWeight: '800' },
  name: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  memo: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  tag: { fontSize: 12, color: '#999', backgroundColor: '#f8f8f8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  btnGroup: { flexDirection: 'row', gap: 6 },
  stateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  wishlistBtnActive: { backgroundColor: '#FF6B6B' },
  visitedBtnActive: { backgroundColor: '#00B894' },
  stateBtnText: { fontSize: 12, color: '#888', fontWeight: '500' },
  activeText: { color: '#fff' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
  },
  copyBtnDone: { backgroundColor: '#E8FFF9' },
  copyBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  copyBtnTextDone: { color: '#00B894' },
});
