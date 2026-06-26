import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CATEGORY_BG, CATEGORY_COLORS } from '@/constants/filters';
import { confirmAction, notify } from '@/lib/confirm';
import { useAuth } from '@/context/AuthContext';
import { useRestaurants } from '@/context/RestaurantContext';
import { Restaurant, Review } from '@/types/restaurant';

function Stars({ count, size = 20 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < count ? 'star' : 'star-outline'}
          size={size}
          color={i < count ? '#FDCB6E' : '#ddd'}
        />
      ))}
    </View>
  );
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const {
    getRestaurant,
    fetchRestaurantById,
    toggleVisited,
    toggleWishlist,
    deleteRestaurant,
    copyRestaurant,
    getReviews,
    deleteReview,
  } = useRestaurants();

  const local = getRestaurant(id);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(local ?? null);
  const [loadingR, setLoadingR] = useState(!local);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  // 내 리스트에 없으면 DB에서 직접 조회
  useEffect(() => {
    if (local) {
      setRestaurant(local);
      setLoadingR(false);
      return;
    }
    (async () => {
      setLoadingR(true);
      const r = await fetchRestaurantById(id);
      setRestaurant(r);
      setLoadingR(false);
    })();
  }, [id, local, fetchRestaurantById]);

  const loadReviews = useCallback(async () => {
    try {
      setReviews(await getReviews(id));
    } catch {
      // 무시
    }
  }, [id, getReviews]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  if (loadingR) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>맛집을 찾을 수 없어요</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const isMine = restaurant.owner_id === user?.id;
  const { name, area, category, address, naver_map_url, map_source, image_url, tags, memo, visited, wishlist, priority } = restaurant;
  const catColor = category ? CATEGORY_COLORS[category] ?? '#888' : '#888';
  const catBg = category ? CATEGORY_BG[category] ?? '#f5f5f5' : '#f5f5f5';
  const isGoogle = map_source === 'google';

  function handleDelete() {
    confirmAction('맛집 삭제', `"${name}"을(를) 내 리스트에서 삭제할까요?`, async () => {
      setDeleting(true);
      await deleteRestaurant(id);
      router.back();
    }, '삭제', true);
  }

  async function handleCopy() {
    if (!restaurant) return;
    try {
      await copyRestaurant(restaurant);
      setCopied(true);
      notify('담기 완료!', '내 리스트의 "가고싶음"에 추가됐어요.');
    } catch (e: any) {
      notify('오류', e.message ?? '담기에 실패했어요.');
    }
  }

  function handleOpenMap() {
    if (naver_map_url) {
      Linking.openURL(naver_map_url).catch(() => notify('오류', '지도를 열 수 없습니다.'));
      return;
    }
    if (address) {
      const encoded = encodeURIComponent(address);
      const url = isGoogle
        ? `https://www.google.com/maps/search/${encoded}`
        : `https://map.naver.com/v5/search/${encoded}`;
      Linking.openURL(url).catch(() => notify('오류', '지도를 열 수 없습니다.'));
    }
  }

  function handleDeleteReview(reviewId: string) {
    confirmAction('리뷰 삭제', '이 리뷰를 삭제할까요? (관리자)', async () => {
      try {
        await deleteReview(reviewId);
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch (e: any) {
        notify('오류', e.message ?? '삭제 실패');
      }
    }, '삭제', true);
  }

  const avgRating = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {image_url ? <Image source={{ uri: image_url }} style={styles.heroImage} /> : null}

        {/* 헤더 카드 */}
        <View style={styles.heroCard}>
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
              <View style={[styles.areaBadge, { backgroundColor: isGoogle ? '#E8F0FE' : '#E6F8EE' }]}>
                <Text style={[styles.areaBadgeText, { color: isGoogle ? '#4285F4' : '#03C75A', fontWeight: '700' }]}>
                  {isGoogle ? 'G 구글지도' : 'N 네이버지도'}
                </Text>
              </View>
            )}
            {!isMine && (
              <View style={styles.othersBadge}>
                <Text style={styles.othersBadgeText}>다른 사람 리스트</Text>
              </View>
            )}
          </View>
          <Text style={styles.heroName}>{name}</Text>
          <View style={styles.starsRow}>
            <Stars count={priority} />
            <Text style={styles.priorityText}>우선순위 {priority}/5</Text>
            {avgRating !== null && (
              <Text style={styles.reviewRatingText}>· 리뷰 ★{avgRating}.0 ({reviews.length})</Text>
            )}
          </View>

          {isMine ? (
            <View style={styles.stateRow}>
              <Pressable
                onPress={() => {
                  toggleWishlist(id);
                  setRestaurant((r) => (r ? { ...r, wishlist: !r.wishlist } : r));
                }}
                style={[styles.stateToggle, wishlist && styles.wishlistActive]}
              >
                <Ionicons name={wishlist ? 'heart' : 'heart-outline'} size={18} color={wishlist ? '#fff' : '#aaa'} />
                <Text style={[styles.stateToggleText, wishlist && styles.stateToggleTextActive]}>
                  {wishlist ? '가고싶음 ✓' : '가고싶음'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  toggleVisited(id);
                  setRestaurant((r) => (r ? { ...r, visited: !r.visited } : r));
                }}
                style={[styles.stateToggle, visited && styles.visitedActive]}
              >
                <Ionicons name={visited ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={visited ? '#fff' : '#aaa'} />
                <Text style={[styles.stateToggleText, visited && styles.stateToggleTextActive]}>
                  {visited ? '방문 완료' : '방문함'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={handleCopy}
              disabled={copied}
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
            >
              <Ionicons name={copied ? 'checkmark-circle' : 'download-outline'} size={20} color={copied ? '#00B894' : '#fff'} />
              <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
                {copied ? '내 리스트에 담음!' : '내 리스트에 담기'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* 상세 정보 */}
        {(address || memo) && (
          <View style={styles.infoCard}>
            {address && (
              <Pressable onPress={handleOpenMap} style={styles.infoRow}>
                <Text style={styles.infoIcon}>🗺️</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>주소 (탭하면 지도 열기)</Text>
                  <Text style={[styles.infoValue, styles.addressLink]}>{address}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color="#aaa" />
              </Pressable>
            )}
            {memo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📝</Text>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>메모</Text>
                  <Text style={styles.infoValue}>{memo}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 태그 */}
        {tags && tags.length > 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>태그</Text>
            <View style={styles.tagRow}>
              {tags.map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 지도 버튼 (출처에 맞게) */}
        {(naver_map_url || address) && (
          <Pressable
            onPress={handleOpenMap}
            style={({ pressed }) => [
              styles.mapBtn,
              { backgroundColor: isGoogle ? '#4285F4' : '#03C75A' },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.mapBtnText}>{isGoogle ? '구글 지도로 보기' : '네이버 지도로 보기'}</Text>
          </Pressable>
        )}

        {/* 리뷰 섹션 */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewTitleRow}>
            <Text style={styles.reviewTitle}>리뷰 {reviews.length > 0 ? `(${reviews.length})` : ''}</Text>
            <Pressable onPress={() => router.push(`/review/${id}` as any)} style={styles.addReviewBtn}>
              <Ionicons name="create-outline" size={16} color="#FF6B6B" />
              <Text style={styles.addReviewText}>리뷰 작성</Text>
            </Pressable>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.reviewEmpty}>아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{review.display_name[0]}</Text>
                    </View>
                    <Text style={styles.reviewName}>{review.display_name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Stars count={review.rating} size={14} />
                    {isAdmin && (
                      <Pressable onPress={() => handleDeleteReview(review.id)} hitSlop={6}>
                        <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                      </Pressable>
                    )}
                  </View>
                </View>
                {review.content ? <Text style={styles.reviewContent}>{review.content}</Text> : null}
                <Text style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString('ko-KR')}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* 내 맛집일 때만 수정/삭제 */}
        {isMine && (
          <View style={styles.actionRow}>
            <Pressable
              onPress={() => router.push({ pathname: '/form', params: { id } })}
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="create-outline" size={18} color="#6C5CE7" />
              <Text style={styles.editBtnText}>수정</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
              <Text style={styles.deleteBtnText}>삭제</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.timestamp}>
          추가일: {new Date(restaurant.created_at).toLocaleDateString('ko-KR')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFound: { fontSize: 17, color: '#555' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FF6B6B', borderRadius: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  heroImage: { width: '100%', height: 200, borderRadius: 16, backgroundColor: '#f0f0f0' },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  badges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  areaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f0f0f0' },
  areaBadgeText: { fontSize: 13, color: '#666' },
  othersBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F0EEFF' },
  othersBadgeText: { fontSize: 13, color: '#6C5CE7', fontWeight: '600' },
  heroName: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  priorityText: { fontSize: 13, color: '#888' },
  reviewRatingText: { fontSize: 13, color: '#888' },

  stateRow: { flexDirection: 'row', gap: 8 },
  stateToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  wishlistActive: { backgroundColor: '#FF6B6B' },
  visitedActive: { backgroundColor: '#00B894' },
  stateToggleText: { fontSize: 14, color: '#888', fontWeight: '500' },
  stateToggleTextActive: { color: '#fff' },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
  },
  copyBtnDone: { backgroundColor: '#E8FFF9' },
  copyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  copyBtnTextDone: { color: '#00B894' },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#333', lineHeight: 22 },
  addressLink: { color: '#0984E3', textDecorationLine: 'underline' },

  sectionTitle: { fontSize: 13, color: '#aaa', fontWeight: '600', marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 13, color: '#666' },

  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#03C75A',
    borderRadius: 14,
    paddingVertical: 14,
  },
  mapBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  addReviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addReviewText: { fontSize: 14, color: '#FF6B6B', fontWeight: '600' },
  reviewEmpty: { fontSize: 14, color: '#bbb', textAlign: 'center', paddingVertical: 16 },

  reviewCard: { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 12, gap: 6 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#333' },
  reviewContent: { fontSize: 14, color: '#555', lineHeight: 20 },
  reviewDate: { fontSize: 12, color: '#bbb' },

  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#6C5CE7',
  },
  editBtnText: { color: '#6C5CE7', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
  },
  deleteBtnText: { color: '#FF6B6B', fontSize: 15, fontWeight: '700' },
  timestamp: { textAlign: 'center', fontSize: 12, color: '#ccc' },
});
