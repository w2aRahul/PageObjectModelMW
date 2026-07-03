# PageObjectModelMW — Framework Architecture

Mobile test automation framework for the **Way2Automation MediShop** Android app, built on **MobileWright** (a Playwright-style test runner for native mobile apps) with **TypeScript** and the **Page Object Model (POM)** design pattern.

---

## 1. Tech Stack

| Concern | Technology |
|--------|------------|
| Test runner | [`mobilewright`](https://www.npmjs.com/package/mobilewright) / `@mobilewright/test` |
| Core device API | `@mobilewright/core` (`Device`, `Screen` types) |
| Language | TypeScript 5.x |
| Design pattern | Page Object Model + fixtures |
| Target platform | Android (real device / emulator) |
| App under test | `com.way2automation.medishop` (MediShop) |
| Reporting | Built-in HTML reporter + [Allure](https://allurereport.org/) (`allure-playwright` + `allure-commandline`) |

The API deliberately mirrors Playwright (`test.extend`, `beforeEach`/`afterEach`, `getByTestId`, `getByText`, `swipe`, fixtures), so anyone familiar with Playwright web testing will recognize the structure — the difference is the target is a native Android app driven through a `Device` + `Screen` abstraction instead of a browser page.

---

## 2. Directory Layout

```
PageObjectModelMW/
├── mobilewright.config.ts     # Global runner + device configuration
├── package.json               # Scripts & dependencies
│
├── app/
│   └── way2automation.apk     # The app binary (optional install source)
│
├── pages/                     # Page Object Model classes (the core abstraction)
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   └── CartPage.ts
│
├── fixtures/
│   └── test.ts                # Custom test fixture wiring page objects
│
├── testData/
│   └── loginData.json         # External data for data-driven tests
│
├── tests/                     # Production test specs (use POM + fixtures)
│   └── login.test.ts
│
├── rough/                     # Scratch / experimental specs (NOT POM-based)
│   ├── login.test.ts
│   └── datadriven.test.ts
│
├── playwright-report/         # Generated HTML report output
├── test-results/              # Generated run artifacts
├── allure-results/            # Raw Allure results (generated each run, git-ignored)
└── allure-report/             # Generated Allure HTML report (git-ignored)
```

---

## 3. Architecture Overview

The framework is built in four layers. Test specs never touch the device directly — they go through page objects, which are injected by fixtures, which are configured by the runner config.

```
┌────────────────────────────────────────────────────────────┐
│  mobilewright.config.ts                                     │
│  Defines platform, device, bundleId, timeout, reporter      │
└───────────────────────────┬────────────────────────────────┘
                            │ provides base { device, screen } fixtures
                            ▼
┌────────────────────────────────────────────────────────────┐
│  fixtures/test.ts   (extends base test)                     │
│  Injects loginPage / homePage / cartPage as fixtures        │
└───────────────────────────┬────────────────────────────────┘
                            │ constructs page objects with (screen, device)
                            ▼
┌────────────────────────────────────────────────────────────┐
│  pages/*.ts   (Page Object Model)                           │
│  Locators (private getters) + Actions (async methods)       │
│  Wraps all Screen/Device interactions                       │
└───────────────────────────┬────────────────────────────────┘
                            │ used by
                            ▼
┌────────────────────────────────────────────────────────────┐
│  tests/*.test.ts   +   testData/*.json                      │
│  Business-readable scenarios; data-driven via JSON          │
└────────────────────────────────────────────────────────────┘
```

**Key principle:** the `rough/` folder shows the "before" state — raw scripts where every locator and interaction is inlined into the test. The `pages/` + `fixtures/` + `tests/` folders show the "after" state — the same behavior refactored into the Page Object Model. Comparing them is the clearest way to understand what the framework buys you.

---

## 4. What Each File Does

### 4.1 `mobilewright.config.ts` — Runner Configuration

The single source of truth for how tests run. Passed to `defineConfig()`.

| Setting | Value | Purpose |
|--------|-------|---------|
| `platform` | `'android'` | Target OS |
| `bundleId` | `'com.way2automation.medishop'` | App package under test |
| `deviceName` | `'R3CT204N57L'` | Physical device serial (from `adb devices`) |
| `autoAppLaunch` | `true` | Auto-launch the app at session start |
| `reporter` | `[['list'], ['html'], ['allure-playwright', {...}]]` | Console list + HTML report + Allure results |
| `timeout` | `90_000` | 90s per-test timeout |

The `reporter` is an array of Playwright-style `[name, options?]` tuples (MobileWright forwards them straight to Playwright's reporter resolution). `allure-playwright` writes raw results to `allure-results/` with `{ detail: true, suiteTitle: true }`; the `allure-commandline` CLI (via the `allure:*` npm scripts) turns those into the browsable `allure-report/`. See §7.

Commented-out sections preserve alternatives that are ready to enable:
- `installApps: './app/way2automation.apk'` — install the APK before running (instead of assuming it's pre-installed).
- `workers` / `fullyParallel` — parallel execution.
- `projects[]` — a matrix to run the same suite against multiple targets (e.g. `Samsung-RealDevice` and `Emulator`), each with its own `use` block.

### 4.2 `fixtures/test.ts` — Dependency Injection Layer

This is the glue between the runner and the page objects. It extends the base MobileWright `test` with a typed set of custom fixtures:

```ts
export const test = base.extend<Pages>({
    loginPage: async ({ screen, device }, use) => use(new LoginPage(screen, device)),
    homePage:  async ({ screen }, use)          => use(new HomePage(screen)),
    cartPage:  async ({ screen }, use)          => use(new CartPage(screen)),
});
```

- It consumes the framework's built-in `screen` and `device` fixtures.
- It constructs each page object, injecting those dependencies, and hands the instance to the test via `use()`.
- A fresh page object is created **per test**, keeping tests isolated.
- Also re-exports `expect` so specs import both `test` and `expect` from one place.

`LoginPage` receives **both** `screen` and `device` (it needs `device.launchApp` / `device.driver.typeText`); `HomePage` and `CartPage` only need `screen`.

### 4.3 `pages/` — Page Object Model

Each class models one screen of the app. The consistent convention is:
- **Locators** = `private get`ters (or private methods for parameterized ones) returning a `Screen` element handle. They are lazy — evaluated when accessed, never cached.
- **Actions** = `public async` methods that express user intent in business language.

Dependencies (`screen`, `device`) are injected via `readonly` constructor parameters, so pages never reach for globals.

#### `LoginPage.ts` (most complex — handles login + app lifecycle)

Also exports `APP_PACKAGE = 'com.way2automation.medishop'`, reused by the specs.

Locators: `emailField` (`getByTestId('email_id')`), `passwordField` (`getByTestId('password_id')`), `termsCheckbox` (`getByType('android.widget.CheckBox')`), `signInButton` (`getByText('Sign In')`).

Actions:
- `open()` — launches the app and waits for the login screen to settle.
- `waitForLoad(ms=10000)` — a simple sleep helper (used as a settle wait).
- `clearAndFill(field, value)` — a private helper that robustly clears an existing value before typing: taps + long-presses the field, and if the Android "Select all → Cut" context menu appears, uses it to clear; otherwise falls back to `field.fill()` or `device.driver.typeText()`. This handles pre-populated fields reliably.
- `enterEmail()` / `enterPassword()` — thin wrappers over `clearAndFill`.
- `acceptTermsandSubmit()` — dismisses the keyboard (`pressButton('BACK')`), ticks the terms checkbox, taps Sign In.
- `login(email, password)` — the high-level orchestration that composes all of the above end to end.

The `Field` type alias (`ReturnType<Screen['getByTestId']>`) types the element handle so helpers like `clearAndFill` stay type-safe.

#### `HomePage.ts` (product listing / navigation)

Locators: `medicineList` (`getByTestId('list_id')`), `category(name)` (parameterized `getByText`), `cartTab` (`getByText('Cart')`).

Actions:
- `selectCategory(name)` — taps a category chip (e.g. "Fever").
- `swipeList(direction, timeout)` — swipes the medicine list (defaults to left).
- `openMedicine(name)` — **keeps swiping the list left until the target medicine becomes visible**, then taps it. Encapsulates a scroll-to-find loop.
- `goToCart()` — opens the Cart tab.

#### `CartPage.ts` (cart management)

Locator: `removeButtons` (`getByLabel('Remove')`) — matches every Remove button in the cart.

Actions:
- `itemCount()` — returns how many Remove buttons exist (= items in cart).
- `emptyCart()` — loops, tapping the first Remove button and waiting 1s, until the cart is empty.

### 4.4 `testData/loginData.json` — External Test Data

An array of `{ email, password }` credential objects. Decouples data from logic so the same test flow can run against multiple inputs without code changes. Consumed two ways:
- `tests/login.test.ts` uses `testData[0]` for its shared login.
- `rough/datadriven.test.ts` iterates the whole array to generate one test per record.

### 4.5 `tests/login.test.ts` — Production Spec (the intended pattern)

Demonstrates the fully-assembled framework:

```ts
import { test } from '../fixtures/test';          // custom fixture, not the base runner
import { APP_PACKAGE } from '../pages/LoginPage';
import testData from '../testData/loginData.json';

const login = testData[0];

test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(login.email, login.password);
});

test.afterEach(async ({ device, loginPage }) => {
    await loginPage.waitForLoad();
    await device.terminateApp(APP_PACKAGE);
});

test.skip('Search Medicine Test', async ({ homePage }) => { ... });
test('Empty Cart Test', async ({ homePage, cartPage }) => {
    await homePage.goToCart();
    await cartPage.emptyCart();
});
```

Note how readable the test body is — no locators, no sleeps, no Android quirks. All of that lives in the page objects. `beforeEach` logs in fresh before every test; `afterEach` terminates the app for isolation. `test.skip(...)` parks the search test without deleting it.

### 4.6 `rough/` — Scratch / Reference Specs

Experimental, self-contained scripts that import the **base** `@mobilewright/test` directly (bypassing fixtures and page objects). Kept as a reference/comparison — they are the "raw" versions of the refactored production tests.

- `rough/login.test.ts` — the same login + cart flow with every locator, sleep, and Android context-menu workaround inlined into `beforeEach`/tests. This is what `LoginPage`/`HomePage`/`CartPage` were extracted from.
- `rough/datadriven.test.ts` — **data-driven pattern demo**: a `for (const data of testData)` loop that generates a separate `test(...)` per credential set in `loginData.json`, again with inlined interactions.

> These live outside `tests/` intentionally, so they're not part of the maintained suite but remain available as learning references.

---

## 5. Core Concepts Reference

### Fixtures (dependency injection)
MobileWright provides base fixtures — `device` (app lifecycle: `launchApp`, `terminateApp`, `driver`) and `screen` (element queries + gestures). `fixtures/test.ts` builds page-object fixtures on top of them. Requesting a fixture in a test signature (`{ homePage, cartPage }`) triggers its construction automatically.

### `Screen` query API (Playwright-style locators)
| Method | Selects by |
|--------|-----------|
| `getByTestId('id')` | accessibility/test id |
| `getByText('Sign In')` | visible text (supports `{ exact: false }`) |
| `getByType('android.widget.CheckBox')` | native widget class |
| `getByLabel('Remove')` | accessibility label |

Element handles expose interactions: `tap()`, `fill()`, `longPress()`, `swipe()`, `isVisible()`, `count()`, `first()`, `nth()`.

### `Device` API
App/session lifecycle: `launchApp(pkg)`, `terminateApp(pkg)`, and `driver.typeText()` for low-level text entry.

---

## 6. How to Run

```bash
npm test                # run the suite (mobilewright test)
npm run test:report     # run with HTML reporter, then open the report
```

**Prerequisites:** an Android device/emulator connected and visible to `adb`, with its serial matching `deviceName` in `mobilewright.config.ts`, and the MediShop app installed (or enable `installApps` to push the APK from `app/`). **Java 8+** is required for the Allure report (see §7).

---

## 7. Reporting

Two reporters run on every `npm test`, wired via the `reporter` array in `mobilewright.config.ts`:

1. **HTML** (built-in) → `playwright-report/`; open with `npm run test:report`.
2. **Allure** (`allure-playwright`) → raw results in `allure-results/`.

Allure is a two-stage process: the test run drops machine-readable result files into `allure-results/`, then the `allure-commandline` CLI renders them into a static HTML site in `allure-report/`.

```bash
npm test                 # produces allure-results/
npm run allure:generate  # allure-results/ → allure-report/  (allure generate --clean)
npm run allure:open      # open the generated allure-report/
npm run allure:serve     # generate + open a temporary report in one step
```

| npm script | Command | Purpose |
|-----------|---------|---------|
| `allure:generate` | `allure generate allure-results --clean -o allure-report` | Build the static report |
| `allure:open` | `allure open allure-report` | Serve the built report |
| `allure:serve` | `allure serve allure-results` | Build to a temp dir and serve immediately |

Both `allure-results/` and `allure-report/` are git-ignored (regenerated each run). The Allure CLI is a **Java** tool, so a JRE (8+) must be on the `PATH`.

> **CI note:** the GitHub Actions workflow only installs deps and type-checks — Allure results require an actual on-device run, which hosted runners can't do. Generate the Allure report locally or on a self-hosted runner with an attached device.

---

## 8. Design Rationale — Why POM Here

1. **Readability** — tests read as user stories (`homePage.goToCart(); cartPage.emptyCart();`).
2. **Maintainability** — a UI change (e.g. a new locator) is fixed in one page object, not across every test.
3. **Reuse** — `login()`, `openMedicine()`, `emptyCart()` are shared building blocks.
4. **Isolation** — per-test page objects and `beforeEach`/`afterEach` app lifecycle keep tests independent.
5. **Separation of concerns** — config, wiring (fixtures), UI abstraction (pages), data (JSON), and scenarios (tests) each live in their own layer.

The `rough/` → `tests/` progression in this repo is essentially a worked example of that refactor.
