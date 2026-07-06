# DB 백업 가이드 (출시 체크리스트 F3)

Supabase Free 플랜은 자동 백업이 없어서, GitHub Actions 로 **매주 월요일 03:00(KST)**
DB 전체(스키마+데이터)를 덤프해 암호화한 뒤 아티팩트로 90일 보관합니다.
워크플로: [.github/workflows/db-backup.yml](../.github/workflows/db-backup.yml)

## 1회 설정 (저장소 시크릿 2개 등록)

GitHub 저장소 → **Settings → Secrets and variables → Actions → New repository secret**

| 시크릿 이름 | 값 |
|---|---|
| `SUPABASE_DB_URL` | Supabase 대시보드 → 상단 **Connect** → **Session pooler** URI. `[YOUR-PASSWORD]` 자리에 DB 비밀번호를 넣은 전체 문자열 |
| `BACKUP_PASSPHRASE` | 복호화에 쓸 임의의 긴 문자열(비밀번호 관리자에 보관). **분실하면 백업을 열 수 없음** |

시크릿을 등록하기 전에는 워크플로가 아무것도 하지 않고 조용히 성공 처리됩니다
(공개 저장소라서 암호화 없이 데이터를 올리는 일이 없도록 설계).

## 수동 백업

저장소 → **Actions → DB 백업 → Run workflow**. 완료되면 해당 실행 페이지의
Artifacts 에서 `db-backup-N` 을 내려받을 수 있습니다.

## 복원 방법

```bash
# 1) 복호화 + 압축 해제 → schema.sql, data.sql
openssl enc -d -aes-256-cbc -pbkdf2 -in dump.tgz.enc -out dump.tgz  # 패스프레이즈 입력
tar xzf dump.tgz

# 2) 새(또는 초기화된) Supabase 프로젝트에 순서대로 적용
psql "$SUPABASE_DB_URL" -f schema.sql
psql "$SUPABASE_DB_URL" -f data.sql
```

## 주의

- **Storage 사진은 포함되지 않습니다.** `restaurant-photos` 버킷은 DB 덤프 대상이
  아니므로, 사진까지 보관하려면 Supabase CLI `storage cp -r` 또는 Pro 플랜 백업 사용.
- 사용자가 늘어나 백업이 커지거나(아티팩트 한도) 더 짧은 복구 주기가 필요해지면
  Supabase Pro(일 단위 자동 백업) 전환을 검토하세요.
