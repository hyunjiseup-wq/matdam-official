-- =============================================================
-- migration13: 이미지 업로드 남용 방지 (출시 체크리스트 E2)
-- restaurant-photos 버킷에 서버측 제한을 건다.
--  - 파일 크기: 5MB (클라이언트는 긴 변 1600px JPEG 로 축소해 올림)
--  - MIME: 이미지 4종만 허용
-- 원격 적용명: photo_bucket_limits
-- =============================================================

update storage.buckets
set file_size_limit = 5242880, -- 5MB
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'restaurant-photos';
