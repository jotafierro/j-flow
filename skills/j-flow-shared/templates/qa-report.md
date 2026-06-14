# QA Report — {slug}
Date: {YYYY-MM-DD}
Gate: {green | red}

## Test Results

| Stage | Status | Details |
|-------|--------|---------|
| 1. Unit tests | {✓ PASS / ✗ FAIL} | {N tests} |
| 2. NestJS E2E | {✓ PASS / ✗ FAIL} | {N specs} |
| 3. Flutter integration | {✓ PASS / ✗ FAIL} | {N tests} |
| 4. Playwright E2E | {✓ PASS / ✗ FAIL} | {N scenarios} |
| 5. Visual smoke | {✓ PASS / ✗ FAIL} | Storybook: {ok/fail} · Widgetbook: {ok/fail} |
| 6. Manual checklist | {✓ PASS / ✗ FAIL} | {N/N items} |

## Failures

{If gate is red, paste exact failure output with file:line. Otherwise: "None."}

## Manual Checklist Results

| # | Item | Result |
|---|------|--------|
| 1 | {step from review-guide.md} | {PASS / FAIL} |
| 2 | {step} | {PASS / FAIL} |
