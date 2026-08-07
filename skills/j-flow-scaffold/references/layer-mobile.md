# Scaffold Layer — mobile

If this reference is already in your session context from earlier in this scaffold run, don't re-read it.

Loaded during Step 4 only when `has_mobile`. Covers `apps/mobile` (Flutter) and `apps/mobile/widgetbook`.

**apps/mobile (Flutter) — only if `has_mobile`:**
```bash
cd apps && flutter create mobile --org com.{project} --platforms=ios,android,web --description="{project} mobile app"
cd ..
```

Post-process:
- Edit `apps/mobile/pubspec.yaml` to add deps: `flutter_riverpod: ^2.5.0`, `go_router: ^14.0.0`, `dio: ^5.4.0`
- REPLACE `apps/mobile/lib/main.dart` with a DESIGN.md-aligned welcome screen:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '{Project Name}',
      themeMode: ThemeMode.{themeMode},
      theme: ThemeData.light(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color({primaryLightHex})),
      ),
      darkTheme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color({primaryDarkHex}),
          brightness: Brightness.dark,
        ),
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      body: Center(
        child: Text(
          '{Project Name}',
          style: theme.textTheme.displayMedium?.copyWith(
            color: theme.colorScheme.primary,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
```

Substitution rules for the mobile main.dart:
- `{themeMode}`: `dark` if `default_theme === 'dark'`, otherwise `light`
- `{primaryLightHex}`: `color_primary_light` as `0xFF` + 6 uppercase hex digits (e.g. `0xFF3B82F6`)
- `{primaryDarkHex}`: `color_primary_dark` as `0xFF` + 6 uppercase hex digits (e.g. `0xFF60A5FA`)

REPLACE `apps/mobile/test/widget_test.dart` with a test that matches the new app (replaces the broken counter test):
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('App boots and shows project title', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: MyApp()));
    expect(find.text('{Project Name}'), findsOneWidget);
  });
}
```

- Verify `apps/mobile/analysis_options.yaml` uses `flutter_lints` (default from `flutter create`). Do NOT add custom rules that conflict.

**apps/mobile/widgetbook (Flutter Widgetbook) — only if `has_mobile`:**
```bash
cd apps/mobile && flutter create widgetbook --template=app --platforms=web,macos --description="Widgetbook catalog" --project-name=widgetbook_app
cd ../..
```

The `--project-name=widgetbook_app` flag sets the pubspec `name:` field to `widgetbook_app` while keeping the directory as `widgetbook/`, preventing a self-reference when adding the `widgetbook` package as a dependency.

If `--project-name` is not supported (older Flutter), fallback: after `flutter create`, immediately edit `apps/mobile/widgetbook/pubspec.yaml` to change `name: widgetbook` → `name: widgetbook_app` BEFORE adding any widgetbook deps.

Post-process `apps/mobile/widgetbook/pubspec.yaml` to add `widgetbook: ^3.0.0`, `widgetbook_annotation: ^3.0.0`, and dev_dep `widgetbook_generator: ^3.0.0`.

Replace `apps/mobile/widgetbook/lib/main.dart` with a DESIGN.md-aligned catalog. **IMPORTANT:** an empty `addons: []` causes Widgetbook 3 to render a blank/loading screen — always include `MaterialThemeAddon` (and `ViewportAddon` is highly recommended). Also use `WidgetbookFolder` and wrap the use-case content in a Material-themed Container instead of a bare `Scaffold` (bare Scaffold outside MaterialApp gets stuck on load):

```dart
import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

void main() {
  runApp(const WidgetbookApp());
}

class WidgetbookApp extends StatelessWidget {
  const WidgetbookApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themes = [
      WidgetbookTheme(
        name: 'Light',
        data: ThemeData.light(useMaterial3: true).copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color({primaryLightHex}),
          ),
        ),
      ),
      WidgetbookTheme(
        name: 'Dark',
        data: ThemeData.dark(useMaterial3: true).copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color({primaryDarkHex}),
            brightness: Brightness.dark,
          ),
        ),
      ),
    ];

    return Widgetbook.material(
      directories: [
        WidgetbookFolder(
          name: 'Foundation',
          children: [
            WidgetbookComponent(
              name: 'Welcome',
              useCases: [
                WidgetbookUseCase(
                  name: 'Default',
                  builder: (context) {
                    final theme = Theme.of(context);
                    return Material(
                      color: theme.colorScheme.surface,
                      child: Center(
                        child: Text(
                          '{Project Name}',
                          style: theme.textTheme.displayMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ],
      addons: [
        MaterialThemeAddon(
          themes: themes,
          initialTheme: themes[{default_theme_index}],
        ),
        ViewportAddon([
          IosViewports.iPhone13,
          AndroidViewports.samsungGalaxyS20,
          IosViewports.iPadPro11Inches,
        ]),
        TextScaleAddon(),
      ],
    );
  }
}
```

Substitution rules:
- `{primaryLightHex}`: `color_primary_light` formatted as `0xFF` + 6 uppercase hex digits (e.g. `0xFF3B82F6`)
- `{primaryDarkHex}`: `color_primary_dark` formatted same way
- `{default_theme_index}`: `0` if `default_theme === 'light'`, `1` if `default_theme === 'dark'` — matches `themes[0]` = Light, `themes[1]` = Dark. **Critical:** `initialTheme` must reference the same object instance from the `themes` list — `themes.contains(initialTheme)` uses identity equality, so a new `WidgetbookTheme(...)` with the same data fails the assertion at runtime.
- `{Project Name}`: from PRODUCT.md

The Welcome use case mirrors the mobile app's home screen — same theme tokens, same title centered. Switching the theme addon between Light/Dark in the Widgetbook UI flips both screens consistently.

Replace `apps/mobile/widgetbook/test/widget_test.dart` with a passing test that matches the new package name:
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:widgetbook_app/main.dart';

void main() {
  testWidgets('WidgetbookApp builds', (WidgetTester tester) async {
    await tester.pumpWidget(const WidgetbookApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
```
