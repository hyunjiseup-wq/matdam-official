import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { inferAreaFromAddress } from '@/constants/filters';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Feedback,
  FeedbackReply,
  FeedbackStatus,
  Profile,
  Restaurant,
  Review,
  VisitedFilter,
} from '@/types/restaurant';
import rawSeedData from '@/seoul_restaurant_app_starter/restaurants_from_json.json';

// ── 타입 ─────────────────────────────────────────────────────────────────────

type NewRestaurant = Omit<Restaurant, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;
type EditRestaurant = Partial<Omit<Restaurant, 'id' | 'owner_id' | 'created_at'>>;

interface RestaurantContextType {
  restaurants: Restaurant[];
  filteredRestaurants: Restaurant[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  provinceFilter: string | null;
  areaFilter: string | null;
  categoryFilter: string | null;
  visitedFilter: VisitedFilter;
  setSearchQuery: (q: string) => void;
  setProvinceFilter: (p: string | null) => void;
  setAreaFilter: (a: string | null) => void;
  setCategoryFilter: (c: string | null) => void;
  setVisitedFilter: (v: VisitedFilter) => void;
  getRestaurant: (id: string) => Restaurant | undefined;
  fetchRestaurantById: (id: string) => Promise<Restaurant | null>;
  addRestaurant: (data: NewRestaurant) => Promise<string>;
  updateRestaurant: (id: string, data: EditRestaurant) => Promise<void>;
  deleteRestaurant: (id: string) => Promise<void>;
  toggleVisited: (id: string) => Promise<void>;
  toggleWishlist: (id: string) => Promise<void>;
  copyRestaurant: (src: Restaurant) => Promise<string>;
  uploadPhoto: (file: Blob, ext?: string) => Promise<string>;
  // 둘러보기 / 프로필
  getUsers: () => Promise<Profile[]>;
  getUserRestaurants: (userId: string) => Promise<Restaurant[]>;
  getProfile: (userId: string) => Promise<Profile | null>;
  updateProfile: (patch: { display_name?: string; bio?: string; sns_url?: string }) => Promise<void>;
  likeList: (ownerId: string) => Promise<void>;
  unlikeList: (ownerId: string) => Promise<void>;
  incrementProfileView: (ownerId: string) => Promise<void>;
  // 리뷰
  getReviews: (restaurantId: string) => Promise<Review[]>;
  saveReview: (restaurantId: string, rating: number, content: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  // 피드백
  submitFeedback: (type: string, content: string) => Promise<void>;
  getFeedbackById: (id: string) => Promise<Feedback | null>;
  getMyFeedback: () => Promise<Feedback[]>;
  getAllFeedback: () => Promise<Feedback[]>;
  getFeedbackReplies: (feedbackId: string) => Promise<FeedbackReply[]>;
  addFeedbackReply: (feedbackId: string, content: string) => Promise<void>;
  setFeedbackStatus: (id: string, status: FeedbackStatus) => Promise<void>;
  deleteFeedback: (id: string) => Promise<void>;
}

// ── Supabase 행 변환 ─────────────────────────────────────────────────────────

const RESTAURANT_COLUMNS =
  'id, owner_id, name, area, category, address, naver_map_url, map_source, image_url, tags, memo, visited, wishlist, priority, created_at, updated_at';

type SupabaseRow = {
  id: string;
  owner_id: string | null;
  name: string;
  area: string | null;
  category: string | null;
  address: string | null;
  naver_map_url: string | null;
  map_source: string | null;
  image_url: string | null;
  tags: string[] | null;
  memo: string | null;
  visited: boolean | null;
  wishlist: boolean | null;
  priority: number;
  created_at: string;
  updated_at: string;
};

function fromRow(row: SupabaseRow): Restaurant {
  return {
    id: row.id,
    owner_id: row.owner_id ?? '',
    name: row.name,
    area: row.area ?? undefined,
    category: row.category ?? undefined,
    address: row.address ?? undefined,
    naver_map_url: row.naver_map_url ?? undefined,
    map_source: (row.map_source as Restaurant['map_source']) ?? undefined,
    image_url: row.image_url ?? undefined,
    tags: row.tags ?? undefined,
    memo: row.memo ?? undefined,
    visited: row.visited ?? false,
    wishlist: row.wishlist ?? false,
    priority: row.priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── 초기 시드 (관리자 전용) ───────────────────────────────────────────────────

const SEEDED_KEY = '@supabase_seeded';

interface RawItem {
  id: number | string;
  name: string;
  area?: string;
  category?: string;
  address?: string;
  naver_map_url?: string;
  tags?: string | string[];
  memo?: string;
  visited?: boolean;
  priority?: number;
}

function makeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function seedIfEmpty(ownerId: string) {
  const already = await AsyncStorage.getItem(SEEDED_KEY);
  if (already) return;

  const { count, error: countError } = await supabase
    .from('seoul_restaurants')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.warn('[Seed] Supabase error:', countError.message);
    return;
  }

  if (count && count > 0) {
    await AsyncStorage.setItem(SEEDED_KEY, 'true');
    return;
  }

  const rows = (rawSeedData as RawItem[]).map((r) => {
    const tags = Array.isArray(r.tags)
      ? r.tags.filter(Boolean)
      : typeof r.tags === 'string' && r.tags.trim()
      ? r.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : null;
    const area = r.area || inferAreaFromAddress(r.address) || null;
    return {
      id: makeUUID(),
      owner_id: ownerId,
      name: r.name,
      area,
      category: r.category || null,
      address: r.address || null,
      naver_map_url: r.naver_map_url || null,
      image_url: null,
      tags: tags && tags.length > 0 ? tags : null,
      memo: r.memo || null,
      visited: false,
      priority: r.priority ?? 3,
    };
  });

  let allOk = true;
  for (let i = 0; i < rows.length; i += 50) {
    const { error } = await supabase.from('seoul_restaurants').insert(rows.slice(i, i + 50));
    if (error) {
      console.warn('[Seed] Insert error:', error.message);
      allOk = false;
      break;
    }
  }

  if (allOk) await AsyncStorage.setItem(SEEDED_KEY, 'true');
}

async function claimUnowned(ownerId: string) {
  const { error } = await supabase
    .from('seoul_restaurants')
    .update({ owner_id: ownerId })
    .is('owner_id', null);
  if (error) console.warn('[Claim] error:', error.message);
}

// ── Context ───────────────────────────────────────────────────────────────────

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const userId = user?.id ?? null;
  const displayName =
    user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? '익명';

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [provinceFilter, setProvinceFilter] = useState<string | null>(null);
  const [areaFilter, setAreaFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('all');

  const fetchMine = useCallback(async (uid: string) => {
    const { data, error: err } = await supabase
      .from('seoul_restaurants')
      .select(RESTAURANT_COLUMNS)
      .eq('owner_id', uid)
      .order('priority', { ascending: false })
      .order('name', { ascending: true });

    if (err) setError(err.message);
    else {
      setRestaurants((data as SupabaseRow[]).map(fromRow));
      setError(null);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setRestaurants([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      if (isAdmin) {
        await seedIfEmpty(userId);
        await claimUnowned(userId);
      }
      if (!cancelled) await fetchMine(userId);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isAdmin, fetchMine]);

  // ── 필터링 ─────────────────────────────────────────────────────────────────

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return restaurants.filter((r) => {
      if (q) {
        const hay = `${r.name} ${r.area ?? ''} ${r.memo ?? ''} ${r.address ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      // provinceFilter는 시/도 (예: 서울), 주소 앞부분과 매칭
      if (provinceFilter && !(r.address ?? '').includes(provinceFilter)) return false;
      // areaFilter는 "구" 단위 (예: 마포구) 또는 동네(area)와 매칭
      if (areaFilter) {
        const inDistrict = r.address?.includes(areaFilter);
        const inArea = r.area === areaFilter;
        if (!inDistrict && !inArea) return false;
      }
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (visitedFilter === 'visited' && !r.visited) return false;
      if (visitedFilter === 'wishlist' && !r.wishlist) return false;
      return true;
    });
  }, [restaurants, searchQuery, provinceFilter, areaFilter, categoryFilter, visitedFilter]);

  const getRestaurant = useCallback(
    (id: string) => restaurants.find((r) => r.id === id),
    [restaurants],
  );

  const fetchRestaurantById = useCallback(async (id: string): Promise<Restaurant | null> => {
    const { data, error: err } = await supabase
      .from('seoul_restaurants')
      .select(RESTAURANT_COLUMNS)
      .eq('id', id)
      .single();
    if (err || !data) return null;
    return fromRow(data as SupabaseRow);
  }, []);

  // ── 사진 업로드 ──────────────────────────────────────────────────────────

  const uploadPhoto = useCallback(
    async (file: Blob, ext = 'jpg'): Promise<string> => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const path = `${userId}/${makeUUID()}.${ext}`;
      const { error: err } = await supabase.storage
        .from('restaurant-photos')
        .upload(path, file, { contentType: (file as any).type || 'image/jpeg', upsert: false });
      if (err) throw new Error(err.message);
      const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path);
      return data.publicUrl;
    },
    [userId],
  );

  // ── 내 리스트 CRUD ─────────────────────────────────────────────────────────

  const addRestaurant = useCallback(
    async (data: NewRestaurant) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const newId = makeUUID();
      const { data: row, error: err } = await supabase
        .from('seoul_restaurants')
        .insert({
          id: newId,
          owner_id: userId,
          name: data.name,
          area: data.area ?? null,
          category: data.category ?? null,
          address: data.address ?? null,
          naver_map_url: data.naver_map_url ?? null,
          map_source: data.map_source ?? null,
          image_url: data.image_url ?? null,
          tags: data.tags ?? null,
          memo: data.memo ?? null,
          visited: data.visited ?? false,
          wishlist: data.wishlist ?? false,
          priority: data.priority,
        })
        .select(RESTAURANT_COLUMNS)
        .single();

      if (err) throw new Error(err.message);
      setRestaurants((prev) => [fromRow(row as SupabaseRow), ...prev]);
      return newId;
    },
    [userId],
  );

  const updateRestaurant = useCallback(
    async (id: string, data: EditRestaurant) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase
        .from('seoul_restaurants')
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.area !== undefined && { area: data.area ?? null }),
          ...(data.category !== undefined && { category: data.category ?? null }),
          ...(data.address !== undefined && { address: data.address ?? null }),
          ...(data.naver_map_url !== undefined && { naver_map_url: data.naver_map_url ?? null }),
          ...(data.map_source !== undefined && { map_source: data.map_source ?? null }),
          ...(data.image_url !== undefined && { image_url: data.image_url ?? null }),
          ...(data.tags !== undefined && { tags: data.tags ?? null }),
          ...(data.memo !== undefined && { memo: data.memo ?? null }),
          ...(data.visited !== undefined && { visited: data.visited }),
          ...(data.wishlist !== undefined && { wishlist: data.wishlist }),
          ...(data.priority !== undefined && { priority: data.priority }),
        })
        .eq('id', id)
        .eq('owner_id', userId);

      if (err) throw new Error(err.message);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data, updated_at: new Date().toISOString() } : r)),
      );
    },
    [userId],
  );

  const deleteRestaurant = useCallback(
    async (id: string) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase
        .from('seoul_restaurants')
        .delete()
        .eq('id', id)
        .eq('owner_id', userId);
      if (err) throw new Error(err.message);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
    },
    [userId],
  );

  const toggleVisited = useCallback(
    async (id: string) => {
      const target = restaurants.find((r) => r.id === id);
      if (!target) return;
      await updateRestaurant(id, { visited: !target.visited });
    },
    [restaurants, updateRestaurant],
  );

  const toggleWishlist = useCallback(
    async (id: string) => {
      const target = restaurants.find((r) => r.id === id);
      if (!target) return;
      await updateRestaurant(id, { wishlist: !target.wishlist });
    },
    [restaurants, updateRestaurant],
  );

  const copyRestaurant = useCallback(
    async (src: Restaurant) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const newId = makeUUID();
      const { data: row, error: err } = await supabase
        .from('seoul_restaurants')
        .insert({
          id: newId,
          owner_id: userId,
          name: src.name,
          area: src.area ?? null,
          category: src.category ?? null,
          address: src.address ?? null,
          naver_map_url: src.naver_map_url ?? null,
          map_source: src.map_source ?? null,
          image_url: src.image_url ?? null,
          tags: src.tags ?? null,
          memo: src.memo ?? null,
          visited: false,
          wishlist: true,
          priority: src.priority,
        })
        .select(RESTAURANT_COLUMNS)
        .single();

      if (err) throw new Error(err.message);
      setRestaurants((prev) => [fromRow(row as SupabaseRow), ...prev]);
      return newId;
    },
    [userId],
  );

  // ── 둘러보기 / 프로필 ─────────────────────────────────────────────────────

  const getUsers = useCallback(async (): Promise<Profile[]> => {
    const { data: profs, error: pErr } = await supabase.from('profiles').select('*');
    if (pErr) throw new Error(pErr.message);

    const { data: owners } = await supabase.from('seoul_restaurants').select('owner_id');
    const counts = new Map<string, number>();
    for (const r of (owners ?? []) as { owner_id: string | null }[]) {
      if (r.owner_id) counts.set(r.owner_id, (counts.get(r.owner_id) ?? 0) + 1);
    }

    const { data: likes } = await supabase.from('list_likes').select('liker_id, owner_id');
    const likeCounts = new Map<string, number>();
    const myLikes = new Set<string>();
    for (const l of (likes ?? []) as { liker_id: string; owner_id: string }[]) {
      likeCounts.set(l.owner_id, (likeCounts.get(l.owner_id) ?? 0) + 1);
      if (l.liker_id === userId) myLikes.add(l.owner_id);
    }

    const result = (profs as Profile[]).map((p) => ({
      ...p,
      count: counts.get(p.id) ?? 0,
      like_count: likeCounts.get(p.id) ?? 0,
      liked: myLikes.has(p.id),
    }));

    // 인기순: 좋아요 → 조회수 → 맛집수
    result.sort(
      (a, b) =>
        (b.like_count ?? 0) - (a.like_count ?? 0) ||
        (b.view_count ?? 0) - (a.view_count ?? 0) ||
        (b.count ?? 0) - (a.count ?? 0),
    );
    return result;
  }, [userId]);

  const getUserRestaurants = useCallback(async (uid: string): Promise<Restaurant[]> => {
    const { data, error: err } = await supabase
      .from('seoul_restaurants')
      .select(RESTAURANT_COLUMNS)
      .eq('owner_id', uid)
      .order('priority', { ascending: false })
      .order('name', { ascending: true });
    if (err) throw new Error(err.message);
    return (data as SupabaseRow[]).map(fromRow);
  }, []);

  const getProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    return (data as Profile) ?? null;
  }, []);

  const updateProfile = useCallback(
    async (patch: { display_name?: string; bio?: string; sns_url?: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase
        .from('profiles')
        .update({
          ...(patch.display_name !== undefined && { display_name: patch.display_name }),
          ...(patch.bio !== undefined && { bio: patch.bio || null }),
          ...(patch.sns_url !== undefined && { sns_url: patch.sns_url || null }),
        })
        .eq('id', userId);
      if (err) throw new Error(err.message);
      if (patch.display_name !== undefined) {
        await supabase.auth.updateUser({ data: { display_name: patch.display_name } });
      }
    },
    [userId],
  );

  const likeList = useCallback(
    async (ownerId: string) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase
        .from('list_likes')
        .upsert({ liker_id: userId, owner_id: ownerId });
      if (err) throw new Error(err.message);
    },
    [userId],
  );

  const unlikeList = useCallback(
    async (ownerId: string) => {
      if (!userId) return;
      await supabase.from('list_likes').delete().eq('liker_id', userId).eq('owner_id', ownerId);
    },
    [userId],
  );

  const incrementProfileView = useCallback(
    async (ownerId: string) => {
      if (!ownerId || ownerId === userId) return;
      await supabase.rpc('increment_profile_view', { p_id: ownerId });
    },
    [userId],
  );

  // ── 리뷰 ─────────────────────────────────────────────────────────────────

  const getReviews = useCallback(async (restaurantId: string): Promise<Review[]> => {
    const { data, error: err } = await supabase
      .from('restaurant_reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });
    if (err) throw new Error(err.message);
    return (data ?? []) as Review[];
  }, []);

  const saveReview = useCallback(
    async (restaurantId: string, rating: number, content: string) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase.from('restaurant_reviews').upsert(
        {
          id: makeUUID(),
          restaurant_id: restaurantId,
          user_id: userId,
          display_name: displayName,
          rating,
          content: content.trim() || null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,restaurant_id' },
      );
      if (err) throw new Error(err.message);
    },
    [userId, displayName],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      if (!isAdmin) throw new Error('관리자만 삭제할 수 있어요');
      const { error: err } = await supabase.from('restaurant_reviews').delete().eq('id', reviewId);
      if (err) throw new Error(err.message);
    },
    [isAdmin],
  );

  // ── 피드백 ────────────────────────────────────────────────────────────────

  const submitFeedback = useCallback(
    async (type: string, content: string) => {
      const { error: err } = await supabase.from('app_feedback').insert({
        id: makeUUID(),
        user_id: userId ?? null,
        display_name: displayName,
        type,
        content,
        status: 'open',
      });
      if (err) throw new Error(err.message);
    },
    [userId, displayName],
  );

  const getFeedbackById = useCallback(async (id: string): Promise<Feedback | null> => {
    const { data } = await supabase.from('app_feedback').select('*').eq('id', id).single();
    return (data as Feedback) ?? null;
  }, []);

  const getMyFeedback = useCallback(async (): Promise<Feedback[]> => {
    if (!userId) return [];
    const { data, error: err } = await supabase
      .from('app_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (err) throw new Error(err.message);
    return (data ?? []) as Feedback[];
  }, [userId]);

  const getAllFeedback = useCallback(async (): Promise<Feedback[]> => {
    if (!isAdmin) throw new Error('관리자만 볼 수 있어요');
    const { data, error: err } = await supabase
      .from('app_feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) throw new Error(err.message);
    return (data ?? []) as Feedback[];
  }, [isAdmin]);

  const getFeedbackReplies = useCallback(async (feedbackId: string): Promise<FeedbackReply[]> => {
    const { data, error: err } = await supabase
      .from('feedback_replies')
      .select('*')
      .eq('feedback_id', feedbackId)
      .order('created_at', { ascending: true });
    if (err) throw new Error(err.message);
    return (data ?? []) as FeedbackReply[];
  }, []);

  const addFeedbackReply = useCallback(
    async (feedbackId: string, content: string) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase.from('feedback_replies').insert({
        id: makeUUID(),
        feedback_id: feedbackId,
        user_id: userId,
        is_admin: isAdmin,
        display_name: displayName,
        content,
      });
      if (err) throw new Error(err.message);
    },
    [userId, isAdmin, displayName],
  );

  const setFeedbackStatus = useCallback(
    async (id: string, status: FeedbackStatus) => {
      if (!isAdmin) throw new Error('관리자만 가능해요');
      const { error: err } = await supabase.from('app_feedback').update({ status }).eq('id', id);
      if (err) throw new Error(err.message);
    },
    [isAdmin],
  );

  const deleteFeedback = useCallback(
    async (id: string) => {
      if (!isAdmin) throw new Error('관리자만 가능해요');
      const { error: err } = await supabase.from('app_feedback').delete().eq('id', id);
      if (err) throw new Error(err.message);
    },
    [isAdmin],
  );

  // ── Value ─────────────────────────────────────────────────────────────────

  const value = useMemo<RestaurantContextType>(
    () => ({
      restaurants,
      filteredRestaurants,
      loading,
      error,
      searchQuery,
      provinceFilter,
      areaFilter,
      categoryFilter,
      visitedFilter,
      setSearchQuery,
      setProvinceFilter,
      setAreaFilter,
      setCategoryFilter,
      setVisitedFilter,
      getRestaurant,
      fetchRestaurantById,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      toggleVisited,
      toggleWishlist,
      copyRestaurant,
      uploadPhoto,
      getUsers,
      getUserRestaurants,
      getProfile,
      updateProfile,
      likeList,
      unlikeList,
      incrementProfileView,
      getReviews,
      saveReview,
      deleteReview,
      submitFeedback,
      getFeedbackById,
      getMyFeedback,
      getAllFeedback,
      getFeedbackReplies,
      addFeedbackReply,
      setFeedbackStatus,
      deleteFeedback,
    }),
    [
      restaurants,
      filteredRestaurants,
      loading,
      error,
      searchQuery,
      provinceFilter,
      areaFilter,
      categoryFilter,
      visitedFilter,
      getRestaurant,
      fetchRestaurantById,
      addRestaurant,
      updateRestaurant,
      deleteRestaurant,
      toggleVisited,
      toggleWishlist,
      copyRestaurant,
      uploadPhoto,
      getUsers,
      getUserRestaurants,
      getProfile,
      updateProfile,
      likeList,
      unlikeList,
      incrementProfileView,
      getReviews,
      saveReview,
      deleteReview,
      submitFeedback,
      getFeedbackById,
      getMyFeedback,
      getAllFeedback,
      getFeedbackReplies,
      addFeedbackReply,
      setFeedbackStatus,
      deleteFeedback,
    ],
  );

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurants() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) throw new Error('useRestaurants must be used inside RestaurantProvider');
  return ctx;
}
