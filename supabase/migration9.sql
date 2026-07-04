-- SECURITY DEFINER 함수: 익명 호출 차단 (로그인 사용자만 실행 가능)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.increment_profile_view(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_profile_view(uuid) TO authenticated;
