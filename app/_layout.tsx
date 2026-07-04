import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomTabBar from '@/components/BottomTabBar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { RestaurantProvider } from '@/context/RestaurantContext';

function HeaderIcon({ name, onPress }: { name: any; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingHorizontal: 6 }}>
      <Ionicons name={name} size={21} color="#fff" />
    </Pressable>
  );
}

function RootNavigator() {
  const { user, loading, displayName, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // 인증 가드: 로그인 안 됐으면 /login, 로그인됐는데 /login이면 홈으로
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = (segments[0] as string) === 'login';
    if (!user && !inAuthGroup) {
      router.replace('/login' as any);
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF7A45" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
    <View style={styles.appShell}>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FF7A45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#F5F5F5' },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="index"
        options={{
          title: '🍽️ 맛담',
          headerLeft: () => (
            <Pressable
              onPress={signOut}
              style={{ marginLeft: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}
              hitSlop={8}
            >
              <Text style={{ color: '#fff', fontSize: 13 }}>{displayName}</Text>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isAdmin && (
                <HeaderIcon name="mail-outline" onPress={() => router.push('/admin/feedback' as any)} />
              )}
              <HeaderIcon name="chatbubble-outline" onPress={() => router.push('/feedback' as any)} />
            </View>
          ),
        }}
      />
      <Stack.Screen name="discover" options={{ title: '전체 맛집' }} />
      <Stack.Screen name="collections" options={{ title: '테마 컬렉션' }} />
      <Stack.Screen name="map" options={{ title: '🗺️ 맛집 지도' }} />
      <Stack.Screen name="collection/[id]" options={{ title: '컬렉션' }} />
      <Stack.Screen name="guide" options={{ title: '앱 사용법' }} />
      <Stack.Screen name="explore" options={{ title: '둘러보기' }} />
      <Stack.Screen name="user/[id]" options={{ title: '리스트' }} />
      <Stack.Screen name="profile" options={{ title: '내 프로필' }} />
      <Stack.Screen name="my-feedback" options={{ title: '내 피드백' }} />
      <Stack.Screen name="feedback-thread/[id]" options={{ title: '피드백 대화' }} />
      <Stack.Screen
        name="form"
        options={({ route }: any) => ({
          title: route.params?.id ? '맛집 수정' : '맛집 추가',
          presentation: 'modal',
        })}
      />
      <Stack.Screen name="detail/[id]" options={{ title: '맛집 상세' }} />
      <Stack.Screen name="feedback" options={{ title: '피드백 보내기', presentation: 'modal' }} />
      <Stack.Screen name="review/[id]" options={{ title: '리뷰 작성', presentation: 'modal' }} />
      <Stack.Screen name="admin/feedback" options={{ title: '받은 피드백' }} />
    </Stack>
    <BottomTabBar />
    </View>
    </View>
  );
}

// PC 웹에서 앱을 가운데로 모아 모바일 폭으로 보여준다(인스타 웹 느낌).
// 모바일/네이티브 앱에는 영향 없음(flex:1 그대로).
const styles = StyleSheet.create({
  root: {
    flex: 1,
    ...Platform.select({
      web: { alignItems: 'center', backgroundColor: '#E9EAED' } as any,
      default: {},
    }),
  },
  appShell: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: 600,
        backgroundColor: '#F5F5F5',
        boxShadow: '0 0 24px rgba(0,0,0,0.08)',
      } as any,
      default: {},
    }),
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RestaurantProvider>
          <RootNavigator />
        </RestaurantProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
