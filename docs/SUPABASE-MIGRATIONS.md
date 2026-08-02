# Supabase 마이그레이션 운영 가이드

## 현재 상태

- `supabase/config.toml`: Supabase CLI 2.101.0으로 생성한 표준 로컬 구성
- `supabase/migrations/`: 앞으로 사용할 표준 타임스탬프 마이그레이션
- `supabase/migration*.sql`, `schema.sql`: 운영 DB에 수동 적용된 레거시 기록
- 레거시 파일에는 최초 `seoul_restaurants` 생성 SQL이 없어 신규 DB 전체 재현은 아직 불가능

## 적용 전 필수 확인

1. 운영 프로젝트를 CLI에 연결한다.
2. 원격 `supabase_migrations.schema_migrations` 이력과 레거시 파일의 실제 적용 상태를 비교한다.
3. 운영 스키마를 pull해 기준선 마이그레이션을 만든다.
4. Security Advisor와 RLS·함수 실행 권한을 확인한다.
5. `profile_view_rate_limit` 마이그레이션을 스테이징에서 먼저 적용한다.
6. 같은 사용자가 같은 프로필을 하루에 반복 조회해도 1회만 증가하고, 동시 호출도 중복
   집계되지 않는지 확인한다.
7. `profile_view_events`가 사용자-프로필 쌍당 1행만 유지되고 프로필 삭제 CASCADE가
   `profile_view_events_profile_id_idx`를 사용하는지 확인한다.
8. Data API에 필요한 기존 테이블의 `anon`/`authenticated` 권한을 원격 DB에서 명시적으로
   점검한다. 2026년 5월 이후 생성 프로젝트는 새 테이블을 Data API에 자동 노출하지 않는다.

운영 이력을 확인하기 전에 레거시 SQL의 이름을 바꾸거나 `supabase/migrations/`로 단순 복사하면
이미 적용된 SQL이 다시 실행될 수 있으므로 금지합니다.

## 신규 마이그레이션 규칙

- 반드시 고정 버전 CLI의 `supabase migration new <name>`으로 생성
- 테이블 생성과 함께 RLS, 정책, 역할별 `GRANT`/`REVOKE`를 같은 파일에 기록
- `SECURITY DEFINER` 함수는 빈 `search_path`, 호출자 검사, 기본 실행 권한 회수를 포함
- 스테이징 적용과 실제 쿼리 검증 후 운영에 적용

## 이번 정적 감사 결과

- 새 내부 이벤트 테이블은 RLS를 활성화하고 `anon`/`authenticated`의 직접 테이블 권한을 회수함
- 조회수 RPC는 빈 `search_path`, 로그인 사용자 검사, 전체 기본 실행 권한 회수 후
  `authenticated`에만 실행 권한 부여
- 날짜별 이벤트 누적 대신 사용자-프로필 쌍을 원자적 UPSERT해 행 증가를 제한하고 동시 중복 집계 방지
- 복합 기본키가 커버하지 못하는 `profile_id` 외래 키 경로에 별도 인덱스 추가
- 실제 SQL 파싱·쿼리 플랜·동시성 검증은 로컬 Docker 또는 연결된 스테이징 DB가 있어야 완료 가능
