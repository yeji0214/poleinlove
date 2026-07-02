# Troubleshooting

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
