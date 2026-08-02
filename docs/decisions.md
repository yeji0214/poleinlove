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

## 9. 비밀번호 게이트 도입

개인 운동 기록과 사진이 배포 URL만 알면 누구나 볼 수 있는 상태였다. 회원가입/역할 같은 복잡한 인증은 MVP 범위에서 제외했지만(`requirements.md` 4번), 단일 사용자가 쓰는 개인 앱이므로 공유 비밀번호 하나로 접근을 막는 가벼운 방식이면 충분하다고 판단했다.

### 세션 방식: DB 세션 테이블 없이 서명된 쿠키

사용자/세션 테이블을 추가하지 않고, 비밀번호가 맞으면 만료 시각을 담은 값을 서버가 Node 기본 `crypto` 모듈(`createHmac`)로 서명해 `httpOnly` 쿠키에 저장한다. 요청마다 서명을 다시 계산해 비교하고 만료 시각을 확인하는 방식으로 검증한다. 역할/사용자 구분이 없는 단일 비밀번호 구조라 `jose` 같은 JWT 라이브러리를 추가하지 않고 표준 모듈만으로 충분하다고 판단했다.

세션 유지 기간은 30일로 설정했다. 개인 기기에서 자주 쓰는 앱이라 자주 로그아웃되는 것이 번거롭다고 판단했다.

### Next.js 16의 Middleware → Proxy 이름 변경

이 프로젝트가 쓰는 Next.js 버전(16.2.4)부터 기존 `middleware.ts` 컨벤션이 `proxy.ts`로 이름이 바뀌었다(`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). 동작은 동일하지만 파일명과 export 이름(`proxy`)이 다르므로 `src/proxy.ts`로 작성했다. 이 버전의 Proxy는 Edge가 아닌 Node.js 런타임에서 실행되어 `crypto` 같은 Node 내장 모듈을 그대로 쓸 수 있다.

`src/proxy.ts`는 `/login`과 정적 자산을 제외한 모든 경로에서 세션 쿠키를 검증하고, 없거나 만료됐으면 `/login?from=<원래 경로>`로 리다이렉트한다. Server Action은 별도 라우트가 아니라 현재 페이지로의 POST로 처리되므로, 페이지 라우트가 막히면 그 페이지에서 호출되는 Server Action도 함께 보호된다.

### 로그아웃

기록 목록 페이지 헤더에 로그아웃 버튼을 추가했다. 클릭하면 세션 쿠키를 삭제하고 `/login`으로 이동한다.

## 10. 인스타그램 자동 동기화 (Vercel Cron)

기존에는 사용자가 직접 동기화 버튼을 눌러야만 새 릴스가 반영됐다. 매번 확인하고 눌러야 하는 번거로움을 없애기 위해, 새 게시물이 자동으로 반영되도록 개선했다.

### Webhook 대신 주기적 폴링 선택

실시간으로 반영하려면 Instagram Graph API의 webhook을 쓰는 방법도 있지만, "새 게시물 업로드"를 안정적으로 알려주는 webhook 필드가 공식적으로 지원되지 않고 Meta 앱 심사가 다시 필요할 수 있어 복잡도가 높다. 개인용 앱이고 게시 빈도도 하루 1건 수준이라, 기존 동기화 로직(`syncInstagramReels`)을 그대로 재사용해 Vercel Cron으로 자동 실행하는 방식을 선택했다.

Vercel Hobby(무료) 플랜은 Cron Job이 하루 1회로 제한된다. 처음엔 매시간(`0 * * * *`)으로 설정했는데, Hobby 플랜 제한을 초과하는 스케줄은 배포 자체가 생성되지 않고 조용히 실패해서(Deployments 목록에 아예 나타나지 않음) 원인을 찾는 데 시간이 걸렸다. 매일 한국시간 밤 10시(UTC 13시, `0 13 * * *`)에 한 번 실행하는 것으로 변경했다.

### 별도 라우트 + CRON_SECRET으로 보호

기존 `/api/instagram/sync`는 수동 동기화 버튼 전용(POST, `reset` 옵션 포함)이라 그대로 재사용하지 않고 `/api/cron/instagram-sync`(GET)를 새로 만들었다. 이 라우트는 세션 쿠키가 아니라 Vercel이 크론 요청 시 자동으로 담아 보내는 `Authorization: Bearer $CRON_SECRET` 헤더로 보호한다. `src/proxy.ts`의 matcher에서 `api/cron`을 제외해, 로그인 세션이 없는 크론 요청도 이 라우트에 한해 통과하도록 했다. `CRON_SECRET`은 Vercel 프로젝트 환경 변수로 등록한다.

## 11. 사진 업로드를 상태 기반 큐로 재구현

기존 `handleFileChange`는 선택한 파일들을 `for...await` 루프로 하나씩 순차 업로드하고, 실패한 파일은 `if (!error)` 분기에서 그냥 스킵됐다. 사용자에게는 실패 사실도, 실패 이유도 전혀 노출되지 않아 "방금 고른 사진이 조용히 사라지는" 것처럼 보였다.

### 상태를 명시적으로 모델링

파일 하나하나를 `waiting → uploading → success` 또는 `waiting → uploading → error`로 전이하는 독립된 항목으로 다루도록 `src/lib/uploadQueue.ts`에 리듀서를 분리했다. 상태 변경을 컴포넌트 곳곳에서 직접 하지 않고 `ADD/START/SUCCESS/FAIL/REMOVE` 액션을 통해서만 하도록 강제해, `success`인 항목이 실수로 다시 `uploading`으로 돌아가거나 존재하지 않는 항목에 액션이 적용되는 걸 리듀서 레벨에서 막는다.

처음엔 `error` 상태에 재시도 버튼도 넣었는데, 지금 실패 사유(형식 오류, 용량 초과)는 전부 클라이언트 사전 검증에서 걸러지는 결정적 실패라 같은 파일로 재시도해도 항상 같은 이유로 다시 실패한다. 그런데도 재시도 버튼이 있으면 "다시 누르면 될 것"이라는 잘못된 기대를 준다고 판단해, `RETRY` 액션과 버튼을 빼고 실패 시 이유를 보여준 뒤 삭제만 가능하게 단순화했다. (다만 이건 지금 실패 원인이 전부 결정적이기 때문에 내린 결정이라, 나중에 네트워크 오류처럼 재시도하면 성공할 수도 있는 실패 유형이 생기면 다시 검토할 부분이다.)

이미 저장된 기존 이미지(수정 화면 진입 시 `defaultValues.images`)는 이 큐에 넣지 않고 별도의 `existingImages` 배열로 관리한다. 새로 선택한 파일과 달리 실제 `File` 객체가 없어 삭제만 가능한, 성격이 다른 데이터이기 때문이다.

### 병렬 업로드 + 클라이언트 사전 검증

여러 장을 선택하면 순차 대기 없이 동시에 업로드를 시작한다. 업로드 요청을 보내기 전에 파일 크기(10MB)와 MIME 타입을 클라이언트에서 먼저 검사해, 애초에 실패할 게 뻔한 요청으로 네트워크 왕복을 낭비하지 않고 바로 실패 이유를 보여준다.

### 테스트 도입 (Vitest)

`uploadQueueReducer`는 네트워크나 DOM 같은 외부 상태 없이 `(현재 상태, 액션) → 다음 상태`만 계산하는 순수 함수라 테스트하기 좋은 대상이었다. 이 프로젝트에 테스트 러너가 전혀 없어서 Vitest를 devDependency로 추가하고(`vitest.config.mts`, `src/lib/uploadQueue.test.ts`), 상태 전이 규칙(금지된 전이 포함)과 `validateFile`/`generateStoragePath`를 검증하는 테스트를 작성했다. `tsconfig.json`의 `@/*` 경로 별칭을 그대로 쓰기 위해 `vite-tsconfig-paths` 플러그인을 함께 추가했다. React 컴포넌트가 아닌 순수 로직만 대상이라 jsdom이나 Testing Library 없이 Node 환경으로 충분했다.

테스트를 작성하는 과정에서 `generateStoragePath`의 "확장자가 없으면 jpg로 대체" 폴백이 실제로는 한 번도 실행되지 않는 죽은 코드였다는 걸 발견했다. `"photo".split(".").pop()`은 `undefined`가 아니라 `"photo"` 자체를 반환하기 때문에 `?? "jpg"`가 걸릴 일이 없었다. 확장자 없는 파일을 넣으면 파일명 그대로가 확장자처럼 붙는 경로가 생성되는 정도라 기능적으로 깨지진 않았지만, `.` 포함 여부로 명시적으로 분기하도록 고쳤다.

### `verifyToken` 테스트 추가

업로드 큐 다음으로 `src/lib/session.ts`의 `verifyToken`을 테스트했다. 이 프로젝트의 유일한 인증 관문(`src/proxy.ts`가 모든 보호된 경로에서 호출)인데도 테스트가 없었고, 여기서 버그가 나면 "아무나 로그인 없이 들어올 수 있다" 또는 "정상 로그인도 막힌다" 둘 중 하나로 터지는 만큼 이 프로젝트에서 가장 실패 비용이 큰 순수 함수였다.

테스트가 실제 서명 로직으로 유효한 토큰을 만들 수 있어야 해서, 모듈 내부에만 있던 `sign` 함수를 export했다. 서명 로직을 테스트 코드에 따로 복제하면 나중에 서명 방식이 바뀔 때 테스트와 구현이 따로 놀 수 있어서, 실제 함수를 그대로 재사용하는 쪽을 택했다.

검증한 케이스: 정상 토큰 통과, 만료된 토큰 거부, 서명 변조 거부, 만료 시각만 변조(서명과 불일치) 거부, 다른 비밀키로 서명된 토큰 거부, 형식이 깨진 토큰(구분자 없음/서명 부분 없음)과 빈 값/null/undefined 거부.
