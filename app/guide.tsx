import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Step {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: 'home',
    color: '#FF7A45',
    title: '홈 — 내 맛집 리스트',
    desc: '내가 담은 맛집이 모여요. ❤️ 가고싶음 / ✅ 방문함을 따로 체크하고, 지역·카테고리로 필터링할 수 있어요.',
  },
  {
    icon: 'add-circle',
    color: '#FF7A45',
    title: '가운데 ➕ — 맛집 추가',
    desc: '식당 이름·지역·사진을 등록해요. 사진은 직접 업로드하거나 URL을 붙여넣고, 네이버/구글 지도 출처도 고를 수 있어요.',
  },
  {
    icon: 'restaurant',
    color: '#FF7A45',
    title: '전체 맛집 — 모두의 맛집 한눈에',
    desc: '모든 사용자의 맛집을 한 곳에서! 🔥인기순·⭐별점순·👣방문순으로 정렬하고, 👥 몇 명이 담았는지와 👑담은 인기 유저 TOP3도 볼 수 있어요. 🔖 버튼으로 바로 내 리스트에 담기!',
  },
  {
    icon: 'compass',
    color: '#6C5CE7',
    title: '둘러보기 — 다른 사람 리스트',
    desc: '친구·인플루언서들의 맛집 리스트를 구경해요. ❤️ 좋아요를 누르면 인기 리스트가 위로 올라가고, 인스타 링크로 바로 이동할 수 있어요.',
  },
  {
    icon: 'person-circle',
    color: '#6C5CE7',
    title: '마이 — 내 프로필',
    desc: '프로필 사진·닉네임·소개·SNS 링크를 설정해요. 📊 "내 영향력"에서 내 맛집을 몇 명이 담아갔는지도 확인할 수 있어요.',
  },
  {
    icon: 'search',
    color: '#00B894',
    title: '통합 검색',
    desc: '전체 맛집 화면 상단 검색창에서 맛집·지역은 물론 사용자까지 한 번에 찾을 수 있어요.',
  },
  {
    icon: 'chatbubble-ellipses',
    color: '#00B894',
    title: '피드백 — 의견 보내기',
    desc: '오른쪽 위 💬 아이콘으로 건의·버그·정보수정을 보내주세요. 관리자가 1:1로 답글을 달아드려요!',
  },
];

export default function GuideScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 히어로 */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🍊🍽️</Text>
          <Text style={styles.heroTitle}>맛담 사용법</Text>
          <Text style={styles.heroSub}>맛집을 담고, 친구와 나누는 공간{'\n'}3분이면 충분해요!</Text>
        </View>

        {/* 하단 탭 안내 */}
        <View style={styles.tabHintCard}>
          <Text style={styles.tabHintTitle}>📱 화면 아래 탭으로 이동해요</Text>
          <View style={styles.tabHintRow}>
            <TabHint icon="home" label="홈" />
            <TabHint icon="restaurant" label="전체 맛집" />
            <TabHint icon="add" label="추가" center />
            <TabHint icon="compass" label="둘러보기" />
            <TabHint icon="person" label="마이" />
          </View>
        </View>

        {/* 단계 */}
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={[styles.stepIcon, { backgroundColor: s.color }]}>
              <Ionicons name={s.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        {/* 팁 */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 이렇게 시작해보세요</Text>
          <Text style={styles.tipText}>
            1. 마이에서 프로필 사진·소개를 채워요{'\n'}
            2. 전체 맛집에서 마음에 드는 곳을 🔖 담아요{'\n'}
            3. ➕로 나만의 맛집도 추가해요{'\n'}
            4. 둘러보기에서 친구 리스트에 ❤️를 눌러요
          </Text>
        </View>

        {/* 시작 버튼 */}
        <Pressable style={styles.startBtn} onPress={() => router.replace('/')}>
          <Text style={styles.startBtnText}>시작하기</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function TabHint({ icon, label, center }: { icon: keyof typeof Ionicons.glyphMap; label: string; center?: boolean }) {
  return (
    <View style={styles.tabHintItem}>
      <View style={[styles.tabHintIcon, center && styles.tabHintIconCenter]}>
        <Ionicons name={icon} size={center ? 20 : 18} color={center ? '#fff' : '#FF7A45'} />
      </View>
      <Text style={styles.tabHintLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 16, paddingBottom: 96 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a' },
  heroSub: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 21 },
  tabHintCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#FFE4D6',
  },
  tabHintTitle: { fontSize: 14, fontWeight: '700', color: '#FF7A45', marginBottom: 12, textAlign: 'center' },
  tabHintRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  tabHintItem: { alignItems: 'center', gap: 5 },
  tabHintIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0E8',
    alignItems: 'center', justifyContent: 'center',
  },
  tabHintIconCenter: { backgroundColor: '#FF7A45', width: 42, height: 42, borderRadius: 21 },
  tabHintLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  stepCard: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  stepIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  stepDesc: { fontSize: 13, color: '#666', lineHeight: 20 },
  tipCard: {
    backgroundColor: '#F3F0FF', borderRadius: 14, padding: 16, marginTop: 6, marginBottom: 16,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#6C5CE7', marginBottom: 8 },
  tipText: { fontSize: 13, color: '#555', lineHeight: 22 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FF7A45', borderRadius: 14, paddingVertical: 16,
  },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
