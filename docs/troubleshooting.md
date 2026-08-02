# Troubleshooting

## GitHub Actions CI 첫 실행이 `npm ci` 단계에서 바로 실패

### 증상

CI를 처음 붙이고 커밋을 푸시하자 `Run npm ci` 단계에서 바로 실패했다.

```
Failed to load config file "/home/runner/work/poleinlove/poleinlove" as a
TypeScript/JavaScript module. Error: PrismaConfigEnvError: Missing required
environment variable: DATABASE_URL
```

`npm ci`의 `postinstall` 훅으로 실행되는 `prisma generate`가 `DATABASE_URL`이 없다며 죽은 것이다.

### 원인

CI 붙이기 전에 로컬에서 `env -u DATABASE_URL -u DIRECT_URL npx prisma generate`로 "DATABASE_URL 없이도 잘 된다"고 확인했었는데, 이게 잘못된 검증이었다. `prisma.config.ts`가 최상단에서 `import "dotenv/config"`를 실행하는데, 이건 셸에서 물려받은 환경 변수와 무관하게 프로젝트 루트의 `.env` **파일을 디스크에서 직접 읽어** `process.env`에 채워 넣는다. 로컬에는 `.env` 파일이 실제로 존재해서(`DATABASE_URL` 포함), 셸에서 `env -u`로 지워봤자 `dotenv/config`가 파일에서 다시 채워 넣어 검증 자체가 무의미했다. `.env`는 `.gitignore`에 걸려 있어 CI 체크아웃본에는 애초에 존재하지 않으니, `dotenv/config`가 아무것도 채우지 못하고 `env("DATABASE_URL")`이 그대로 예외를 던졌다.

### 최종 해결

`.env`/`.env.local`을 실제로 다른 위치로 옮겨 디스크에서 없앤 상태로 다시 검증했다. 이 상태에서 `DATABASE_URL`에 아무 문자열이나(`postgresql://user:password@localhost:5432/db`) 넣어주면 `prisma generate`가 정상 통과한다는 걸 확인했다 — 이 값이 실제로 접속 가능한지는 검증하지 않고, 존재 여부만 확인하는 것이었다. `.github/workflows/ci.yml`의 job에 `env: DATABASE_URL: "postgresql://user:password@localhost:5432/db"`를 추가했다. 진짜 값이 필요 없으므로 GitHub Secrets에 실제 운영 DB 자격증명을 등록할 필요도 없다.

### 교훈

- `.env` 파일이 있는 프로젝트에서 "환경 변수 없이도 동작하는지" 검증하려면 셸 변수만 지우는 걸로는 부족하다. `dotenv` 계열 라이브러리는 파일을 직접 읽으므로, 파일 자체를 치우고 검증해야 한다.
- 로컬 개발 환경은 대부분 `.env`가 이미 채워져 있어 "필수값이 없을 때" 상황을 무심코 재현하기 어렵다. CI처럼 정말로 빈 환경에서 한 번 돌려보는 것 자체가 이런 종류의 버그를 잡는 실질적인 값어치였다 — 역설적으로, CI를 붙이자마자 CI가 제 역할을 증명한 셈이다.

## 인스타그램 자동 동기화가 60일 뒤 조용히 끊길 뻔한 문제

### 증상

아직 실제로 발생하진 않았지만, Vercel Cron 자동 동기화(`docs/decisions.md` 10번)를 붙이면서 코드를 살펴보다가 발견했다. 인스타그램 연동 후 60일이 지나면 토큰이 만료되어 동기화가 실패하기 시작할 상황이었고, 특히 크론은 실패해도 화면에 아무것도 표시되지 않아 알아챌 방법이 없었다.

### 원인

인스타그램 장기 토큰은 60일마다 갱신이 필요하고, 만료 임박 시(7일 이내) 자동 갱신하는 로직(`getValidToken`) 자체는 이미 존재했다. 하지만 이 로직은 `api/instagram/media/route.ts`에만 있었는데, 이 라우트는 릴스 목록을 보고 골라서 가져오던 예전 UI(`records/instagram/page.tsx`)가 호출하던 것이었다. `5453ce2` 커밋에서 "버튼 하나로 전체 동기화"하는 지금 방식(`syncInstagramReels`, `/api/instagram/sync`)으로 전환하며 그 예전 UI(`page.tsx`, `actions.ts`)는 삭제했는데, UI가 호출하던 `api/instagram/media/route.ts`는 정리에서 빠졌다. 그 결과 토큰 갱신 로직이 어디서도 호출되지 않는 죽은 코드로 남았고, 실제 동기화 경로(수동 버튼, 크론) 둘 다 토큰을 만료 체크 없이 그냥 읽어다 썼다.

### 최종 해결

`getValidAccessToken()`이라는 이름으로 `src/lib/instagram-sync.ts`의 공용 함수로 옮기고, `/api/instagram/sync`와 `/api/cron/instagram-sync` 양쪽 모두 토큰을 직접 읽는 대신 이 함수를 거치도록 바꿨다. 크론이 매일 실행되므로 "만료 7일 이내면 갱신" 조건이 매일 체크되어 사실상 토큰이 만료될 일이 없어진다. 더 이상 쓰이지 않는 `api/instagram/media/route.ts`는 삭제했다.

### 교훈

- 기능을 다른 방식으로 갈아탈 때, 이전 UI/컴포넌트뿐 아니라 그게 호출하던 API 라우트까지 함께 지워야 한다. 호출부만 지우면 라우트는 죽은 코드로 남는다.
- 죽은 코드가 단순히 안 쓰이는 걸로 끝나지 않고, 그 안에 있던 유효한 로직(토큰 갱신)까지 함께 묻혀서 실제로 필요한 곳에 연결이 안 되는 문제로 이어질 수 있다.

## Vercel 배포 후 `/records` 페이지 서버 에러

### 증상

로그인 성공 후 `/records` 페이지에서 "This page couldn't load / A server error occurred" 에러 발생.

Vercel 함수 로그에서 확인한 실제 에러:

```
Error [PrismaClientInitializationError]:
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x".
Ensure that you ran `prisma generate` and that
"libquery_engine-rhel-openssl-3.0.x.so.node" has been copied to "../../ROOT/src/generated/prisma".
```

### 원인

이 프로젝트는 Prisma 6의 새 TypeScript 제너레이터(`prisma-client`)와 커스텀 output 경로(`src/generated/prisma`)를 사용하고 있었다. 문제는 두 가지가 겹쳐서 발생했다.

1. **플랫폼 바이너리 누락**: 로컬(macOS)에서 생성된 Prisma 엔진 바이너리는 `darwin-arm64` 용이다. Vercel은 Linux(`rhel-openssl-3.0.x`)에서 실행되므로 해당 플랫폼용 바이너리가 별도로 필요하다.

2. **커스텀 output 경로가 배포 번들에 포함되지 않음**: Next.js 16은 프로덕션 빌드에 Turbopack을 사용하는데, Turbopack이 `outputFileTracingIncludes` 옵션을 지원하지 않아 `src/generated/prisma/` 안의 바이너리 파일이 Vercel 런타임 번들에 포함되지 않았다.

### 시도한 해결 방법

**1차 시도 — `binaryTargets` 추가 (부분 해결)**

`schema.prisma`에 Vercel Linux 환경용 바이너리 타겟을 추가하고, 빌드 스크립트에서 `prisma generate`를 명시적으로 실행했다.

```prisma
generator client {
  provider      = "prisma-client"
  output        = "../src/generated/prisma"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

```json
"build": "prisma generate && next build"
```

결과: `prisma generate` 실행 시 Linux용 바이너리(`libquery_engine-rhel-openssl-3.0.x.so.node`)가 로컬에 생성되는 것은 확인됐지만, 배포 시 번들에 포함되지 않아 동일한 에러 지속.

**2차 시도 — `outputFileTracingIncludes` 추가 (효과 없음)**

Next.js가 커스텀 경로의 파일을 배포 번들에 포함하도록 `next.config.ts`에 설정을 추가했다.

```ts
outputFileTracingIncludes: {
  "/*": ["./src/generated/prisma/**/*"],
},
```

결과: Next.js 16이 프로덕션 빌드에 Turbopack을 사용하고, Turbopack은 `outputFileTracingIncludes`를 지원하지 않아 효과 없음.

### 최종 해결

커스텀 output 경로를 없애고 Prisma 기본 위치(`node_modules/@prisma/client`)를 사용하도록 전환했다. Vercel은 `node_modules`를 배포 번들에 항상 포함하므로 파일 추적 문제가 완전히 사라진다.

`schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

`src/lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'
```

`next.config.ts`: `outputFileTracingIncludes` 제거.

로컬에서 타입이 갱신되지 않는 경우 `npx prisma generate` 후 VS Code에서 TypeScript 서버를 재시작(`Cmd+Shift+P` → "TypeScript: Restart TS Server")해야 한다.

### 교훈

- Prisma 6의 `prisma-client` TypeScript 제너레이터와 커스텀 output 경로는 Vercel 배포 시 파일 추적 문제를 일으킬 수 있다.
- Next.js 16 + Turbopack 환경에서는 `outputFileTracingIncludes`가 동작하지 않는다.
- Vercel + Prisma 조합에서는 `prisma-client-js` + 기본 output(`node_modules/@prisma/client`) 조합이 가장 안정적이다.
