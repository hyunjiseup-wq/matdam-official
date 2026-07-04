import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { inferAreaFromAddress, inferDistrictFromAddress } from '@/constants/filters';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Collection,
  DiscoverItem,
  Feedback,
  FeedbackReply,
  FeedbackStatus,
  MenuItem,
  MyInfluence,
  OwnerRef,
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
  getDiscoverFeed: () => Promise<DiscoverItem[]>;
  getMyInfluence: () => Promise<MyInfluence>;
  getProfile: (userId: string) => Promise<Profile | null>;
  updateProfile: (patch: { display_name?: string; bio?: string; sns_url?: string; avatar_url?: string; preferred_region?: string }) => Promise<void>;
  likeList: (ownerId: string) => Promise<void>;
  unlikeList: (ownerId: string) => Promise<void>;
  incrementProfileView: (ownerId: string) => Promise<void>;
  // 테마 컬렉션
  getCollections: () => Promise<Collection[]>;
  getCollection: (id: string) => Promise<Collection | null>;
  getCollectionRestaurants: (collectionId: string) => Promise<Restaurant[]>;
  createCollection: (data: { title: string; emoji?: string; description?: string }) => Promise<string>;
  deleteCollection: (id: string) => Promise<void>;
  addToCollection: (collectionId: string, restaurantId: string) => Promise<void>;
  removeFromCollection: (collectionId: string, restaurantId: string) => Promise<void>;
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
  'id, owner_id, name, area, category, address, naver_map_url, map_source, image_url, tags, memo, price_range, menus, visited, wishlist, priority, created_at, updated_at';

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
  price_range: string | null;
  menus: MenuItem[] | null;
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
    price_range: row.price_range ?? undefined,
    menus: row.menus && row.menus.length > 0 ? row.menus : undefined,
    visited: row.visited ?? false,
    wishlist: row.wishlist ?? false,
    priority: row.priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── 맛집 그룹핑 (같은 맛집 = 이름 + 지역) ─────────────────────────────────────

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, '');
}

// "같은 맛집" 판단 키: 정규화된 이름 + 지역(구 단위 우선, 없으면 area)
function groupKeyOf(r: { name: string; address?: string | null; area?: string | null }): string {
  const region = inferDistrictFromAddress(r.address ?? undefined) || r.area || '';
  return `${normalizeName(r.name)}|${region}`;
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
          price_range: data.price_range ?? null,
          menus: data.menus && data.menus.length > 0 ? data.menus : null,
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
          ...(data.price_range !== undefined && { price_range: data.price_range ?? null }),
          ...(data.menus !== undefined && { menus: data.menus && data.menus.length > 0 ? data.menus : null }),
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
          price_range: src.price_range ?? null,
          menus: src.menus && src.menus.length > 0 ? src.menus : null,
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

  // ── 전체 맛집 통합 피드 (사용자 구분 없이 한 곳에서) ───────────────────────
  const getDiscoverFeed = useCallback(async (): Promise<DiscoverItem[]> => {
    const [rowsRes, profsRes, likesRes, reviewsRes] = await Promise.all([
      supabase.from('seoul_restaurants').select(RESTAURANT_COLUMNS),
      supabase.from('profiles').select('id, display_name, is_admin, sns_url, avatar_url'),
      supabase.from('list_likes').select('owner_id'),
      supabase.from('restaurant_reviews').select('restaurant_id, rating'),
    ]);

    // 좋아요 수(사용자 인기) 집계
    const likeCount = new Map<string, number>();
    for (const l of (likesRes.data ?? []) as { owner_id: string }[]) {
      likeCount.set(l.owner_id, (likeCount.get(l.owner_id) ?? 0) + 1);
    }

    // 프로필 맵
    type ProfRow = { id: string; display_name: string; is_admin: boolean; sns_url: string | null; avatar_url: string | null };
    const profMap = new Map<string, ProfRow>();
    for (const p of (profsRes.data ?? []) as ProfRow[]) profMap.set(p.id, p);

    // 맛집별 별점 집계
    const ratingsByRid = new Map<string, number[]>();
    for (const rv of (reviewsRes.data ?? []) as { restaurant_id: string; rating: number }[]) {
      const arr = ratingsByRid.get(rv.restaurant_id) ?? [];
      arr.push(rv.rating);
      ratingsByRid.set(rv.restaurant_id, arr);
    }

    // 그룹핑 (이름 + 지역)
    const groups = new Map<string, Restaurant[]>();
    for (const row of (rowsRes.data ?? []) as SupabaseRow[]) {
      const r = fromRow(row);
      if (!r.owner_id) continue;
      const key = groupKeyOf(r);
      const arr = groups.get(key) ?? [];
      arr.push(r);
      groups.set(key, arr);
    }

    const items: DiscoverItem[] = [];
    for (const [key, list] of groups) {
      // 대표 항목: 사진 있는 것 우선, 그다음 우선순위 높은 것
      const rep = [...list].sort(
        (a, b) =>
          Number(!!b.image_url) - Number(!!a.image_url) || b.priority - a.priority,
      )[0];

      // 사용자별로 묶기
      const owners = new Map<string, Restaurant[]>();
      for (const r of list) {
        const arr = owners.get(r.owner_id) ?? [];
        arr.push(r);
        owners.set(r.owner_id, arr);
      }

      const ownerRefs: OwnerRef[] = [...owners.keys()]
        .map((oid) => {
          const p = profMap.get(oid);
          return {
            id: oid,
            display_name: p?.display_name ?? '익명',
            is_admin: p?.is_admin ?? false,
            like_count: likeCount.get(oid) ?? 0,
            sns_url: p?.sns_url ?? undefined,
            avatar_url: p?.avatar_url ?? undefined,
          };
        })
        .sort((a, b) => b.like_count - a.like_count || a.display_name.localeCompare(b.display_name));

      // 방문한 사용자 수
      let visitedCount = 0;
      for (const [, rs] of owners) if (rs.some((r) => r.visited)) visitedCount++;

      // 별점 평균 (그룹 내 모든 맛집 id의 리뷰 합산)
      let sum = 0;
      let n = 0;
      for (const r of list) {
        const arr = ratingsByRid.get(r.id);
        if (arr) for (const v of arr) { sum += v; n++; }
      }

      items.push({
        key,
        representativeId: rep.id,
        name: rep.name,
        area: rep.area,
        category: rep.category,
        address: rep.address,
        image_url: list.find((r) => r.image_url)?.image_url ?? rep.image_url,
        map_source: rep.map_source,
        price_range: list.find((r) => r.price_range)?.price_range ?? rep.price_range,
        addedCount: owners.size,
        visitedCount,
        avgRating: n ? sum / n : 0,
        reviewCount: n,
        topOwners: ownerRefs.slice(0, 3),
      });
    }

    return items;
  }, []);

  // ── 인플루언서 지표 (내 맛집을 몇 명이 담아갔나) ──────────────────────────────
  const getMyInfluence = useCallback(async (): Promise<MyInfluence> => {
    if (!userId) return { totalAdoptions: 0, adopterCount: 0, topRestaurants: [] };
    const { data: rows } = await supabase
      .from('seoul_restaurants')
      .select('owner_id, name, area, address');

    type Row = { owner_id: string | null; name: string; area: string | null; address: string | null };
    const all = (rows ?? []) as Row[];

    // 내 맛집 그룹 키 모음
    const myKeys = new Map<string, { name: string; area?: string }>();
    for (const r of all) {
      if (r.owner_id !== userId) continue;
      myKeys.set(groupKeyOf(r), { name: r.name, area: r.area ?? undefined });
    }

    // 같은 키를 가진 '다른 사용자' 모으기
    const othersByKey = new Map<string, Set<string>>();
    for (const r of all) {
      if (!r.owner_id || r.owner_id === userId) continue;
      const k = groupKeyOf(r);
      if (!myKeys.has(k)) continue;
      const set = othersByKey.get(k) ?? new Set<string>();
      set.add(r.owner_id);
      othersByKey.set(k, set);
    }

    const adopters = new Set<string>();
    let totalAdoptions = 0;
    const top: { name: string; area?: string; othersCount: number }[] = [];
    for (const [k, info] of myKeys) {
      const set = othersByKey.get(k);
      const c = set ? set.size : 0;
      if (c > 0) {
        top.push({ ...info, othersCount: c });
        totalAdoptions += c;
        set!.forEach((id) => adopters.add(id));
      }
    }
    top.sort((a, b) => b.othersCount - a.othersCount);

    return { totalAdoptions, adopterCount: adopters.size, topRestaurants: top.slice(0, 5) };
  }, [userId]);

  const getProfile = useCallback(async (uid: string): Promise<Profile | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    return (data as Profile) ?? null;
  }, []);

  const updateProfile = useCallback(
    async (patch: { display_name?: string; bio?: string; sns_url?: string; avatar_url?: string; preferred_region?: string }) => {
      if (!userId) throw new Error('로그인이 필요합니다');
      const { error: err } = await supabase
        .from('profiles')
        .update({
          ...(patch.display_name !== undefined && { display_name: patch.display_name }),
          ...(patch.bio !== undefined && { bio: patch.bio || null }),
          ...(patch.sns_url !== undefined && { sns_url: patch.sns_url || null }),
          ...(patch.avatar_url !== undefined && { avatar_url: patch.avatar_url || null }),
          ...(patch.preferred_region !== undefined && { preferred_region: patch.preferred_region || null }),
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

  // ── 테마 컬렉션 ────────────────────────────────────────────────────────────

  const getCollections = useCallback(async (): Promise<Collection[]> => {
    const [colsRes, itemsRes] = await Promise.all([
      supabase.from('collections').select('*').order('sort_order').order('created_at'),
      supabase
        .from('collection_items')
        .select('collection_id, restaurant:seoul_restaurants(image_url)'),
    ]);
    if (colsRes.error) throw new Error(colsRes.error.message);

    // 컬렉션별 개수 + 사진 미리보기
    const counts = new Map<string, number>();
    const previews = new Map<string, string[]>();
    type ItemRow = { collection_id: string; restaurant: { image_url: string | null } | null };
    for (const it of (itemsRes.data ?? []) as unknown as ItemRow[]) {
      counts.set(it.collection_id, (counts.get(it.collection_id) ?? 0) + 1);
      const img = it.restaurant?.image_url;
      if (img) {
        const arr = previews.get(it.collection_id) ?? [];
        if (arr.length < 3) arr.push(img);
        previews.set(it.collection_id, arr);
      }
    }

    return ((colsRes.data ?? []) as Collection[]).map((c) => ({
      ...c,
      itemCount: counts.get(c.id) ?? 0,
      previewImages: previews.get(c.id) ?? [],
    }));
  }, []);

  const getCollection = useCallback(async (id: string): Promise<Collection | null> => {
    const { data } = await supabase.from('collections').select('*').eq('id', id).single();
    return (data as Collection) ?? null;
  }, []);

  const getCollectionRestaurants = useCallback(
    async (collectionId: string): Promise<Restaurant[]> => {
      const { data, error: err } = await supabase
        .from('collection_items')
        .select(`created_at, restaurant:seoul_restaurants(${RESTAURANT_COLUMNS})`)
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: true });
      if (err) throw new Error(err.message);
      type Row = { restaurant: SupabaseRow | null };
      return ((data ?? []) as unknown as Row[])
        .map((r) => r.restaurant)
        .filter((r): r is SupabaseRow => Boolean(r))
        .map(fromRow);
    },
    [],
  );

  const createCollection = useCallback(
    async (data: { title: string; emoji?: string; description?: string }) => {
      if (!isAdmin) throw new Error('관리자만 컬렉션을 만들 수 있어요');
      const newId = makeUUID();
      const { error: err } = await supabase.from('collections').insert({
        id: newId,
        owner_id: userId,
        title: data.title,
        emoji: data.emoji || null,
        description: data.description || null,
        is_official: true,
      });
      if (err) throw new Error(err.message);
      return newId;
    },
    [isAdmin, userId],
  );

  const deleteCollection = useCallback(
    async (id: string) => {
      if (!isAdmin) throw new Error('관리자만 삭제할 수 있어요');
      const { error: err } = await supabase.from('collections').delete().eq('id', id);
      if (err) throw new Error(err.message);
    },
    [isAdmin],
  );

  const addToCollection = useCallback(
    async (collectionId: string, restaurantId: string) => {
      if (!isAdmin) throw new Error('관리자만 추가할 수 있어요');
      const { error: err } = await supabase.from('collection_items').upsert(
        { id: makeUUID(), collection_id: collectionId, restaurant_id: restaurantId },
        { onConflict: 'collection_id,restaurant_id', ignoreDuplicates: true },
      );
      if (err) throw new Error(err.message);
    },
    [isAdmin],
  );

  const removeFromCollection = useCallback(
    async (collectionId: string, restaurantId: string) => {
      if (!isAdmin) throw new Error('관리자만 제거할 수 있어요');
      const { error: err } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('restaurant_id', restaurantId);
      if (err) throw new Error(err.message);
    },
    [isAdmin],
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
      getDiscoverFeed,
      getMyInfluence,
      getProfile,
      updateProfile,
      likeList,
      unlikeList,
      incrementProfileView,
      getCollections,
      getCollection,
      getCollectionRestaurants,
      createCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
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
      getDiscoverFeed,
      getMyInfluence,
      getProfile,
      updateProfile,
      likeList,
      unlikeList,
      incrementProfileView,
      getCollections,
      getCollection,
      getCollectionRestaurants,
      createCollection,
      deleteCollection,
      addToCollection,
      removeFromCollection,
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
