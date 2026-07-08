# Widgetbook — {Project Name}

Widgetbook 3 catalog for the Flutter app in `apps/mobile`.

## Run

```bash
cd apps/mobile/widgetbook
flutter pub get
flutter run -d chrome   # or -d macos
```

## Where entries live

- `apps/mobile/widgetbook/lib/main.dart` — root Widgetbook app
- `apps/mobile/widgetbook/lib/components/*.dart` — component catalog entries

## Adding an entry

```dart
WidgetbookComponent(
  name: 'MyWidget',
  useCases: [
    WidgetbookUseCase(
      name: 'Default',
      builder: (context) => MyWidget(...),
    ),
  ],
)
```

## Design tokens

Tokens live in [`DESIGN.md`](../DESIGN.md). The mobile theme is in `apps/mobile/lib/main.dart` — derived from the same tokens.

## Default theme

This project's default theme is **{default_theme}**.
