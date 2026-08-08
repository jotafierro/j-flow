# Scaffold Layer — api

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_api`. Covers `apps/api` (NestJS). `packages/api-client` is a separate pre-step in the main skill (it must exist before apps/web or apps/admin run, per Step 4's ordering note) — not part of this file.

**apps/api (NestJS) — only if `has_api`:**
```bash
cd apps && npx -y @nestjs/cli@latest new api --strict --package-manager pnpm --skip-git
cd ..
```

Post-process `apps/api/package.json`:
- Rename to `@{project}/api`
- Add deps: `@nestjs/config` (REQUIRED — without it `.env` is never loaded), `@nestjs/mongoose`, `mongoose`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt`, `class-validator`, `class-transformer`
- **If `api_style: 'rest'`**: also add `@nestjs/swagger`, `swagger-ui-express`
- **If `api_style: 'graphql'`**: also add `@nestjs/graphql`, `@apollo/server`, `@as-integrations/express`, `graphql`
- Add a `dev` script alias (NestJS CLI generates `start:dev` only — alias it as `dev` so commands match the root README):
  ```json
  "scripts": {
    "dev": "nest start --watch",
    "start:dev": "nest start --watch",
    ... rest of nest defaults ...
  }
  ```
- Set port in `apps/api/src/main.ts`:
  - **Both modes**: `await app.listen(process.env.PORT ?? 3000)`. Call `bootstrap()` as `void bootstrap()` — NestJS CLI generates `bootstrap()` which is a floating promise and triggers `@typescript-eslint/no-floating-promises` in CI lint.
  - **If `api_style: 'rest'`**: add `app.setGlobalPrefix('api/v1')`. After `app.useGlobalPipes(...)`, add Swagger setup:
    ```typescript
    import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
    // inside bootstrap(), after useGlobalPipes:
    // ponytail: dev-only; move behind auth if API becomes public-facing
    if (process.env.NODE_ENV !== 'production') {
      const config = new DocumentBuilder()
        .setTitle('{Project Name} API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);
    }
    ```
  - **If `api_style: 'graphql'`**: do NOT add `setGlobalPrefix` — GraphQL operates at `/graphql`; the health endpoint keeps its own path outside the prefix. Add `schema.gql` to `apps/api/.gitignore` (auto-generated at runtime).
- Apply `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in both modes — validates DTOs (REST) and `@InputType()` classes (GraphQL)
- Add `"@{project}/config": "workspace:*"` to devDependencies.

Post-process `apps/api/tsconfig.json`:
1. Add `"types": ["node", "jest"]` to `compilerOptions`. NestJS CLI does not include it, causing the VS Code TS language server to report ts(2593) (`describe`/`it`/`expect` not found) in spec files under `src/`. The CLI (`tsc`) resolves `@types` automatically, but the editor language server needs explicit declaration.
2. Set `"extends": "@{project}/config/tsconfig.nest.json"` (the overlay that carries `experimentalDecorators`/`emitDecoratorMetadata` — see `SKILL.md`'s packages/config step). Remove the `compilerOptions` keys this now inherits from the base or the nest overlay: `esModuleInterop`, `isolatedModules`, `skipLibCheck`, `forceConsistentCasingInFileNames`, `experimentalDecorators`, `emitDecoratorMetadata`, and the four individual strict sub-flags NestJS's CLI lists explicitly (`strictNullChecks`, `noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch` — the base's `strict: true` is a superset of these).
3. Keep everything else **local** to this file — it emits an app, not a shared policy: `module`/`moduleResolution` (`nodenext`, Nest's own resolution, distinct from the base's `bundler`), `target`, `outDir`, `incremental`, `sourceMap`, `declaration`, `removeComments`, `resolvePackageJsonExports`, `allowSyntheticDefaultImports`, `types`.

```json
{
  "extends": "@{project}/config/tsconfig.nest.json",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "resolvePackageJsonExports": true,
    "declaration": true,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "incremental": true,
    "types": ["node", "jest"]
  }
}
```
Merge against the CLI's actual output — do not hand-write the whole file from this snippet; it illustrates which keys survive, not a literal replacement.

Note: `strict: true` (from the base) is a superset of the four sub-flags NestJS lists individually — it also turns on `strictPropertyInitialization`, which the scaffold's own generated health module doesn't trip, but a real project's entities/DTOs might. That's an intentional tightening, not a bug — leave it; don't narrow the base back down to Nest's four flags to silence a future error in code this plan doesn't generate.

Generate health module files:

**`apps/api/src/health/health.controller.ts`**
```typescript
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**`apps/api/src/health/health.module.ts`**
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

**`apps/api/src/health/health.controller.spec.ts`**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });
});
```

Replace `apps/api/src/app.module.ts` with the version appropriate for `api_style`:

**If `api_style: 'rest'`:**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/{project}_dev',
      }),
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

**If `api_style: 'graphql'`:**
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@apollo/server/nestjs';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/{project}_dev',
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: process.env.NODE_ENV !== 'production',
    }),
    HealthModule,
  ],
})
export class AppModule {}
```

`ConfigModule.forRoot({ isGlobal: true })` is what actually loads `.env` — without it, `process.env.MONGODB_URI` is undefined at boot. Substitute `{project}` with the actual project name when writing this file. The fallback URI matches the docker-compose default DB (`MONGO_INITDB_DATABASE={project}_dev`).

Write `apps/api/.env.example`:
```
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/{project}_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=changeme-access-secret
JWT_REFRESH_SECRET=changeme-refresh-secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# Email (dev: Mailhog, prod: Resend)
EMAIL_PROVIDER=mailhog
SMTP_HOST=localhost
SMTP_PORT=1025
```

Also write `apps/api/.env` as a copy of `apps/api/.env.example` so the API runs out of the box — but replace `JWT_ACCESS_SECRET=changeme-access-secret` and `JWT_REFRESH_SECRET=changeme-refresh-secret` with two independently generated values: run `openssl rand -hex 32` twice and substitute each output (never reuse one value for both). The real `.env` never carries the literal `changeme-*` placeholders — those stay in `.env.example` only.

**`apps/api/test/tsconfig.json`** — fixes ts(2593) (`describe`/`it` not found) and ts(6059) (`rootDir` mismatch) in the VS Code TS language server. The test dir imports from `../src/`, so the common source root becomes `..`; `noEmit` prevents emit conflicts with the main tsconfig:
```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["node", "jest"],
    "noEmit": true,
    "declaration": false,
    "composite": false,
    "incremental": false,
    "rootDir": ".."
  },
  "include": ["**/*.ts"]
}
```

**Patch `apps/api/test/app.e2e-spec.ts`** — the NestJS CLI generates an unsafe `res` type in the `.expect()` callback. Find the line:
```typescript
.expect((res) => {
```
and replace with:
```typescript
.expect((res: { body: { status: string } }) => {
```
This eliminates the `@typescript-eslint/no-unsafe-member-access` lint error on `res.body.status`.
