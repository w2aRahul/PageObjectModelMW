# CLAUDE.md

Guidance for AI models (Claude Code) working in this repository. Read this first, then `ARCHITECTURE.md` for the full picture and `SKILLS.md` for the step-by-step build blueprint.

---

## What this project is

A **mobile test-automation framework** for the Way2Automation **MediShop** Android app (`com.way2automation.medishop`), built on **MobileWright** (a Playwright-style test runner for native mobile apps) using **TypeScript** and the **Page Object Model (POM)** pattern.

## Commands

```bash
npm test                # run the suite (mobilewright test)
npm run test:report     # run with HTML reporter, then open it
```

There is no build/lint/typecheck script configured; TypeScript is run by the MobileWright runner directly. There is no unit-test layer — every spec is an on-device e2e test.

## Prerequisites (must hold before tests pass)

- An Android device/emulator connected and visible to `adb devices`.
- Its serial matches `deviceName` in `mobilewright.config.ts`.
- The MediShop app is installed (or enable `installApps` in the config to push `app/way2automation.apk`).

---

## Layout & where things go

| Path | Contains | Rule |
|------|----------|------|
| `mobilewright.config.ts` | runner + device config | single source of truth for platform/device/timeout/reporter |
| `pages/` | Page Object Model classes | one class per app screen |
| `fixtures/test.ts` | custom fixtures wiring page objects | the only place page objects are constructed |
| `testData/*.json` | external test data | no data literals hardcoded in specs |
| `tests/*.test.ts` | maintained production specs | import from `../fixtures/test`, never base runner |
| `rough/*.test.ts` | scratch / reference specs | import base `@mobilewright/test`; NOT maintained |
| `app/` | the `.apk` binary | — |
| `playwright-report/`, `test-results/` | generated output | do not edit; safe to delete |

---

## Conventions (follow these exactly when adding code)

### Page objects (`pages/`)
- **One class per screen.** Class name = `<Screen>Page` (e.g. `LoginPage`, `HomePage`, `CartPage`).
- **Dependencies via constructor injection**, declared `private readonly`:
  ```ts
  constructor(private readonly screen: Screen, private readonly device: Device) {}
  ```
  Only inject `device` if the page needs app lifecycle / driver (`LoginPage` does; `HomePage`/`CartPage` don't).
- **Locators = `private get`ters** returning a `Screen` element handle. Lazy, never cached in fields. Parameterized locators are `private` methods, e.g. `private category(name: string)`.
- **Actions = `public async` methods** named in business language (`login`, `goToCart`, `emptyCart`, `openMedicine`).
- Compose low-level actions into high-level ones (e.g. `login()` calls `enterEmail` + `enterPassword` + `acceptTermsandSubmit`).
- Group with `// ----Locators------` and `// ----Actions----` comment banners (matches existing style).
- Export shared constants like `APP_PACKAGE` from the page that owns them (currently `LoginPage.ts`).

### Fixtures (`fixtures/test.ts`)
- Extend the base test: `base.extend<Pages>({...})`.
- Add a typed entry per page object; construct it and hand it over via `use(new XPage(...))`.
- Re-export `expect` so specs import `test` + `expect` from `../fixtures/test`.

### Tests (`tests/`)
- Import `{ test }` from `../fixtures/test` (NOT from `@mobilewright/test`).
- Request page objects by name in the destructured signature: `async ({ homePage, cartPage }) => {...}`.
- Keep bodies free of locators, sleeps, and platform quirks — those belong in page objects.
- Use `beforeEach` to reach a known state (launch + login) and `afterEach` to reset (terminate app) for isolation.
- Park unfinished tests with `test.skip(...)` rather than deleting them.

### Test data
- Add credentials/inputs to `testData/*.json` as arrays of objects and `import` them. Never inline data in specs.

---

## MobileWright API cheat-sheet

`Screen` locators: `getByTestId`, `getByText` (supports `{ exact: false }`), `getByType('android.widget.X')`, `getByLabel`.
Element handle: `tap()`, `fill()`, `longPress({duration})`, `swipe({direction,timeout})`, `isVisible()`, `count()`, `first()`, `nth()`.
`Screen` misc: `pressButton('BACK')`.
`Device`: `launchApp(pkg)`, `terminateApp(pkg)`, `driver.typeText(text)`.

Types come from `@mobilewright/core` (`Device`, `Screen`). The runner/`test`/`expect` come from `@mobilewright/test` and `mobilewright`.

---

## Known gotchas (do not "fix" naively)

- **Clearing pre-filled text fields** requires the tap → longPress → "Select all"/"Cut" Android context-menu dance (see `LoginPage.clearAndFill`). A plain `fill()` may append instead of replace. Keep the fallback chain.
- **After typing, dismiss the keyboard** with `screen.pressButton('BACK')` before tapping controls it may be covering (e.g. the terms checkbox / Sign In).
- **Scrolling to an off-screen element**: loop `swipe` until `isVisible()` is true (see `HomePage.openMedicine`), don't assume it's on the first page.
- **Waits are currently `setTimeout` sleeps** (`waitForLoad`). If you replace them with proper condition-based waits, do it deliberately and keep tests green on a real device.
- Guard optional-UI checks with `.catch(() => false)` on `isVisible()` (the context menu may not appear).

---

## When adding a new screen/feature

1. Create `pages/<Name>Page.ts` following the conventions above.
2. Register it as a fixture in `fixtures/test.ts` (add to the `Pages` type + an `extend` entry).
3. Write the spec in `tests/`, driving only through the page object.
4. Put any new data in `testData/`.
5. Prototype freely in `rough/` if useful, then refactor into the POM layers.

Keep the layer boundaries intact: **config → fixtures → pages → tests/data.** Tests must never touch `screen`/`device` directly (that's what `rough/` shows as the anti-pattern).
