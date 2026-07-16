import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 3초 등록 데모: 자동으로 순환하는 3단계
const DEMO_STEPS = [
  { emoji: '🔗', title: '지도 링크 복사', desc: '네이버·구글 지도에서\n가게 링크를 복사하고' },
  { emoji: '📋', title: '맛담에 붙여넣기', desc: '추가 화면에\n그대로 붙여넣으면' },
  { emoji: '✨', title: '자동 완성!', desc: '이름·주소·지도까지\n3초 만에 채워져요' },
];

const FEATURES = [
  { emoji: '🗺️', title: '지도로 한눈에', desc: '담은 맛집을 지도 위에서 바로' },
  { emoji: '🧭', title: '테마 컬렉션', desc: '데이트·혼밥·노포, 상황별 모음' },
  { emoji: '💛', title: '둘러보고 담기', desc: '다른 사람 리스트에서 원클릭 저장' },
  { emoji: '⭐', title: '리뷰·별점', desc: '함께 쌓는 진짜 방문 후기' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  // 데모 단계 자동 전환 (페이드 아웃 → 다음 단계 → 페이드 인)
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
        setStep((s) => (s + 1) % DEMO_STEPS.length);
        Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
      });
    }, 2000);
    return () => clearInterval(id);
  }, [fade]);

  const demo = DEMO_STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 히어로 */}
        <View style={styles.hero}>
          <Image source={require('../assets/icon.png')} style={styles.appIcon} />
          <Text style={styles.title}>맛담</Text>
          <Text style={styles.tagline}>맛집을 담고, 친구와 나누는 공간</Text>
          <Text style={styles.heroSub}>
            프랜차이즈와 핫플만이 아니라{'\n'}골목 노포까지 — 진짜 맛있는 곳을 담아요
          </Text>

          <Pressable
            onPress={() => router.push('/login' as any)}
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="restaurant" size={19} color="#fff" />
            <Text style={styles.ctaText}>무료로 시작하기</Text>
          </Pressable>
          <Text style={styles.loginLink} onPress={() => router.push('/login' as any)}>
            이미 계정이 있으신가요? <Text style={styles.loginLinkStrong}>로그인</Text>
          </Text>
        </View>

        {/* 3초 등록 데모 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>등록은 3초면 끝 ⚡</Text>
          <View style={styles.demoCard}>
            <Animated.View style={[styles.demoInner, { opacity: fade }]}>
              <Text style={styles.demoEmoji}>{demo.emoji}</Text>
              <Text style={styles.demoTitle}>{demo.title}</Text>
              <Text style={styles.demoDesc}>{demo.desc}</Text>
            </Animated.View>
            <View style={styles.dotRow}>
              {DEMO_STEPS.map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
              ))}
            </View>
          </View>
        </View>

        {/* 기능 소개 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>이런 걸 할 수 있어요</Text>
          <View style={styles.featureGrid}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <Text style={styles.featureEmoji}>{f.emoji}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 앱 설치 (스토어 출시 전까지는 준비 중 표기) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱으로도 만나요 📱</Text>
          <View style={styles.storeRow}>
            <View style={styles.storeBtn}>
              <Ionicons name="logo-google-playstore" size={20} color="#888" />
              <View>
                <Text style={styles.storeSoon}>준비 중</Text>
                <Text style={styles.storeName}>Google Play</Text>
              </View>
            </View>
            <View style={styles.storeBtn}>
              <Ionicons name="logo-apple" size={22} color="#888" />
              <View>
                <Text style={styles.storeSoon}>준비 중</Text>
                <Text style={styles.storeName}>App Store</Text>
              </View>
            </View>
          </View>
          <Text style={styles.storeHint}>지금은 웹에서 바로 이용할 수 있어요</Text>
        </View>

        {/* 푸터: 정책 링크 */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink} onPress={() => router.push('/policy/terms' as any)}>
              이용약관
            </Text>
            <Text style={styles.footerDivider}>·</Text>
            <Text style={styles.footerLink} onPress={() => router.push('/policy/privacy' as any)}>
              개인정보처리방침
            </Text>
          </View>
          <Text style={styles.copyright}>© 2026 맛담</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 32 },
  hero: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 },
  appIcon: { width: 88, height: 88, borderRadius: 22 },
  title: { fontSize: 30, fontWeight: '800', color: '#1a1a1a', marginTop: 14 },
  tagline: { fontSize: 15, color: '#FF7A45', fontWeight: '700', marginTop: 6 },
  heroSub: { fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, marginTop: 10 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF7A45',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 44,
    marginTop: 22,
    shadowColor: '#FF7A45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { fontSize: 13, color: '#aaa', marginTop: 14 },
  loginLinkStrong: { color: '#FF7A45', fontWeight: '700', textDecorationLine: 'underline' },
  section: { paddingHorizontal: 24, marginTop: 36 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 14,
  },
  demoCard: {
    backgroundColor: '#FFF7F3',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE4D6',
    paddingVertical: 26,
    alignItems: 'center',
  },
  demoInner: { alignItems: 'center', height: 118, justifyContent: 'center' },
  demoEmoji: { fontSize: 40 },
  demoTitle: { fontSize: 16, fontWeight: '800', color: '#E05B22', marginTop: 8 },
  demoDesc: { fontSize: 13, color: '#B8734F', textAlign: 'center', lineHeight: 19, marginTop: 6 },
  dotRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FFD9C4' },
  dotActive: { backgroundColor: '#FF7A45' },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    gap: 4,
  },
  featureEmoji: { fontSize: 26 },
  featureTitle: { fontSize: 14, fontWeight: '800', color: '#222', marginTop: 4 },
  featureDesc: { fontSize: 12, color: '#999', lineHeight: 17 },
  storeRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  storeSoon: { fontSize: 10, color: '#aaa' },
  storeName: { fontSize: 14, fontWeight: '700', color: '#888' },
  storeHint: { fontSize: 12, color: '#bbb', textAlign: 'center', marginTop: 10 },
  footer: { alignItems: 'center', marginTop: 44, gap: 8 },
  footerLinks: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLink: { fontSize: 12, color: '#999', textDecorationLine: 'underline' },
  footerDivider: { fontSize: 12, color: '#ddd' },
  copyright: { fontSize: 11, color: '#ccc' },
});
