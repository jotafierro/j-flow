# Manual Testing — {slug} Mobile

Flutter smoke tests. Run on simulator or device.

## Setup

```bash
docker compose up -d
pnpm --filter @{project}/api dev     # :3000

cd apps/mobile

# Android emulator
flutter run --dart-define-from-file=.dart_defines.json

# iOS simulator
flutter run --dart-define-from-file=.dart_defines.json -d iPhone
```

---

## {N}. {AC-N short title} ({ac-id})

1. {screen or navigation action}
2. Expected: {observable result}
3. Verification (if applicable): {secure storage check / debug print / DevTools}

---

## Checklist

| AC | Scenario | Pass |
|----|----------|------|
| {ac-id} | {scenario one line} | [ ] |
