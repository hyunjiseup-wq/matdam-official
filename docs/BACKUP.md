# public 스키마 논리 백업 가이드 (출시 체크리스트 F3)

GitHub Actions 로 **매주 월요일 03:00(KST)** 앱의 `public` 스키마와 데이터를
논리 덤프해 암호화한 뒤 아티팩트로 90일 보관합니다.
워크플로: [.github/workflows/db-backup.yml](../.github/workflows/db-backup.yml)

이 워크플로는 보조 백업입니다. Supabase CLI `db dump`가 제외하는 `auth`, `storage`,
확장 관리 스키마와 사용자 인증 레코드, Storage 실제 파일, 프로젝트 설정은 포함하지 않습니다.
따라서 이 아티팩트 하나만으로 운영 프로젝트 전체를 복제할 수 없습니다.

## 1회 설정 (저장소 시크릿 2개 등록)

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| 시크릿 이름 | 값 |
|---|---|
| `SUPABASE_DB_URL` | Supabase 대시보드 → 상단 **Connect** → **Session pooler** URI. `[YOUR-PASSWORD]` 자리에 DB 비밀번호를 넣은 전체 문자열 |
| `BACKUP_PASSPHRASE` | 복호화에 쓸 임의의 긴 문자열(비밀번호 관리자에 보관). **분실하면 백업을 열 수 없음** |

시크릿을 등록하기 전에는 암호화되지 않은 데이터 업로드를 막기 위해 덤프를 수행하지 않으며,
백업 비활성 상태가 묻히지 않도록 워크플로를 실패 처리합니다.

## 수동 백업

저장소 → **Actions → DB 논리 백업 → Run workflow**. 완료되면 해당 실행 페이지의
Artifacts 에서 `db-backup-N` 을 내려받을 수 있습니다.

## 복원 방법

```bash
# 1) 복호화 + 압축 해제 → schema.sql, data.sql
openssl enc -d -aes-256-cbc -pbkdf2 -in dump.tgz.enc -out dump.tgz  # 패스프레이즈 입력
tar xzf dump.tgz

# 2) 인증 사용자 등 선행 의존성이 준비된 검증용 프로젝트에 순서대로 적용
psql "$SUPABASE_DB_URL" -f schema.sql
psql "$SUPABASE_DB_URL" -f data.sql
```

복원은 운영 DB에 바로 실행하지 말고 빈 스테이징 프로젝트에서 먼저 검증합니다. `profiles`처럼
`auth.users`를 참조하는 데이터가 있으므로 인증 사용자 복원 전략 없이 `data.sql`만 적용하면
외래 키 오류가 날 수 있습니다.

## 주의

- **Storage 사진은 포함되지 않습니다.** `restaurant-photos` 버킷은 DB 덤프 대상이
  아니므로, 사진까지 보관하려면 Supabase CLI `storage cp -r` 또는 Pro 플랜 백업 사용.
- 인증 사용자까지 포함한 전체 재해 복구가 필요하면 Supabase 관리 백업/복제 기능과 Storage
  객체 백업을 별도로 구성하고 실제 복구 훈련을 수행하세요.
- 사용자가 늘어나 백업이 커지거나(아티팩트 한도) 더 짧은 복구 주기가 필요해지면
  Supabase Pro(일 단위 자동 백업) 전환을 검토하세요.
