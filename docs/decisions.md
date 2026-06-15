# Decisions

## 1. Next.js 사용

- 프론트엔드와 서버 로직을 한 프로젝트 안에서 함께 다룰 수 있는 구조를 경험해보고 싶어서 선택했다.
- App Router, Server Actions 등 최신 Next.js 흐름을 익히는 것이 목표다.

## 2. App Router 선택

- 최신 Next.js의 기본 방식이며, 이번 프로젝트를 통해 Server Component / Client Component 구조를 학습하고 싶다.
- 기록 목록, 상세, 작성 페이지를 라우팅하기에도 적합하다.

## 3. Tailwind CSS 선택

- 빠르게 UI를 구현하고, v0에서 생성한 시안을 옮기기에도 유리하다고 판단했다.
- 공통 스타일 규칙을 빠르게 정리하기 좋다.

## 4. Prisma 고려

- TypeScript와 함께 사용할 때 타입 안정성이 좋고, schema와 migration 관리가 편하다고 판단했다.
- 개인 프로젝트에서 DB 구조를 점진적으로 수정하기에 적합하다.

## 5. PostgreSQL 고려

- 배포 후에도 데이터를 안정적으로 유지하고 싶어서 SQLite보다 PostgreSQL을 우선 고려한다.
- 기록, 이미지 메타데이터, 검색 기능 확장을 생각하면 관계형 DB가 적합하다고 판단했다.

## 6. Supabase 선택

- PostgreSQL을 배포 환경에서도 사용할 수 있는 hosted DB로 운영하고 싶어서 선택했다.
- 초기에는 Supabase를 DB 호스팅 용도로만 사용하고, ORM은 Prisma를 유지하기로 했다.
- Neon도 후보였지만, 추후 Auth나 Storage 기능까지 확장할 가능성을 고려했을 때 Supabase가 더 유연하다고 판단했다.
- 다만 초기 MVP에서는 Supabase의 다양한 기능을 모두 사용하지 않고, Postgres 제공자 역할에만 집중한다.

## 7. 달력 기능 제외

- 달력 뷰는 유용하지만 초기 핵심 가치는 기술 검색과 회고에 있다고 판단했다.
- MVP에서는 기록 작성/조회/검색에 집중할 예정이다.

## 7. 이미지 저장 방식

- 이미지 파일은 외부 스토리지에 저장하고, DB에는 이미지 URL과 메타데이터를 저장하는 구조를 고려한다.
- 초기에는 단순 업로드 구조로 시작하고, 이후 다중 이미지/정렬/최적화 기능을 확장할 수 있도록 한다.

## 8. 사진 업로드 구현 방식

### 클라이언트 직접 업로드 (브라우저 → Supabase Storage)

서버를 거치지 않고 브라우저에서 Supabase Storage로 직접 업로드한다.

서버 경유 방식은 구현이 단순하지만 Next.js 기본 body 제한(4MB)에 걸리고, 파일이 불필요하게 서버를 한 번 더 거친다. Supabase anon key는 `NEXT_PUBLIC_` 접두사로 클라이언트에 노출되어도 괜찮은 키이고, 버킷 RLS 정책으로 권한을 제어하므로 보안 문제가 없다.

### 즉시 업로드 (파일 선택 시점)

폼 제출 시가 아닌, 사진을 선택하는 순간 바로 Supabase Storage에 업로드한다.

폼 제출 시 업로드하면 저장 버튼을 눌렀을 때 업로드 대기 시간이 생긴다. 즉시 업로드하면 미리보기와 업로드가 동시에 처리되어 제출 시 지연이 없다. 단, 업로드 후 폼을 제출하지 않고 나가면 Storage에 고아(orphan) 파일이 남는다. 개인 앱 규모에서는 허용 가능한 트레이드오프로 판단했다.

### URL을 hidden input으로 전달

업로드된 이미지 URL을 `imageUrls` hidden input에 콤마(,)로 이어 붙여 Server Action에 전달한다. Server Action은 Record 생성 후 `prisma.image.createMany`로 Image 레코드를 일괄 저장한다. Server Action은 파일 바이너리를 다루지 않고 URL 문자열만 받는다.

### Supabase Storage RLS 설정

Public 버킷은 읽기(SELECT)만 기본 허용된다. 쓰기(INSERT)는 별도 RLS 정책 추가가 필요하다.

```sql
CREATE POLICY "Allow anon uploads"
ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'record-images');
```
