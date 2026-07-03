# SKILLS.md — Build This Framework From Scratch

A reproducible blueprint. Given only this file (plus `CLAUDE.md` and `ARCHITECTURE.md`), an AI model should be able to recreate an equivalent **MobileWright + TypeScript + Page Object Model** mobile-automation framework for any Android app.

Follow the phases in order. Each phase lists **goal → files → exact content pattern → checkpoint**.

---

## Phase 0 — Skills required

The model needs these competencies (all demonstrated in this repo):

1. **TypeScript** — classes, generics, `readonly` params, `ReturnType<>`, async/await, ES module imports, importing JSON.
2. **Page Object Model** — separating *locators* from *actions*, one class per screen, constructor dependency injection.
3. **Playwright-style test runners** — `test.extend` fixtures, `beforeEach`/`afterEach`, `test`/`test.skip`, locator queries.
4. **MobileWright / mobile automation** — `Device` (app lifecycle) vs `Screen` (element queries + gestures), Android widget quirks.
5. **Data-driven testing** — externalizing inputs to JSON and looping to generate tests.

---

## Phase 1 — Project scaffolding

**Goal:** an installable npm project targeting MobileWright.

**Files:**

`package.json`
```json
{
  "name": "<project-name>",
  "version": "1.0.0",
  "description": "Mobile automation tests with MobileWright",
  "scripts": {
    "test": "mobilewright test",
    "test:report": "mobilewright test --reporter html && mobilewright show-report"
  },
  "devDependencies": {
    "@mobilewright/test": "latest",
    "mobilewright": "latest",
    "typescript": "^5.0.0"
  }
}
```

Then `npm install`.

**Checkpoint:** `node_modules/` has `mobilewright`, `@mobilewright/test`, `@mobilewright/core`.

---

## Phase 2 — Runner configuration

**Goal:** tell the runner which device/app to drive.

**File:** `mobilewright.config.ts`
```ts
import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform: 'android',
  bundleId: '<app.package.id>',
  deviceName: '<adb-serial-or-emulator-id>',   // from `adb devices`
  // installApps: './app/<app>.apk',           // enable to push the APK first
  autoAppLaunch: true,
  reporter: 'html',
  timeout: 90_000,
  // workers: 2, fullyParallel: true,          // enable for parallel runs
  // projects: [ /* per-device matrix, each with its own `use` block */ ],
});
```

Put the APK under `app/` if using `installApps`.

**Decisions to record:** the app's package id (`adb shell pm list packages`), the device serial, and a realistic `timeout` (mobile is slow; 90s is a good default).

**Checkpoint:** `npx mobilewright test` connects to the device (even with zero tests).

---

## Phase 3 — Page Object layer (`pages/`)

**Goal:** one class per app screen. This is the heart of the framework.

**Template — copy this shape for every screen:**
```ts
import type { Device, Screen } from '@mobilewright/core';

// Export shared constants from the page that owns them
export const APP_PACKAGE = '<app.package.id>';

// Handy alias for an element handle's type
type Field = ReturnType<Screen['getByTestId']>;

export class <Name>Page {
    constructor(
        private readonly screen: Screen,
        private readonly device: Device,   // include ONLY if this page needs lifecycle/driver
    ) {}

    // ----Locators------
    private get someField()      { return this.screen.getByTestId('some_id'); }
    private byName(name: string) { return this.screen.getByText(name); }        // parameterized locator

    // ----Actions----
    async doSomething() {
        await this.someField.tap();
    }
    // Compose small actions into high-level ones
    async highLevelFlow(a: string, b: string) {
        await this.stepOne(a);
        await this.stepTwo(b);
    }
}
```

**Rules (non-negotiable, they define the pattern):**
- Locators are `private get`ters (or `private` methods when parameterized). Never store elements in fields — re-query each time.
- Actions are `public async`, named for user intent, not UI mechanics.
- Inject dependencies through the constructor; never use globals.
- Only pass `device` to pages that launch/terminate the app or use `device.driver`.

**Reference implementations to reproduce (this repo's three screens):**
- `LoginPage` — locators for email/password/checkbox/sign-in; actions `open()`, `waitForLoad()`, `clearAndFill()` (the Android select-all/cut clearing helper), `enterEmail/Password`, `acceptTermsandSubmit`, and the orchestrating `login()`. Owns `APP_PACKAGE`.
- `HomePage` — list/category/cart-tab locators; `selectCategory`, `swipeList`, `openMedicine` (swipe-until-visible loop), `goToCart`.
- `CartPage` — `removeButtons` locator; `itemCount()` (via `.count()`), `emptyCart()` (loop tapping first Remove until empty).

**Checkpoint:** each page compiles and every device interaction in the app is reachable through some page method.

---

## Phase 4 — Fixtures layer (`fixtures/test.ts`)

**Goal:** auto-construct and inject page objects into tests (dependency injection).

**File:** `fixtures/test.ts`
```ts
import { test as base, expect } from "@mobilewright/test";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { CartPage } from "../pages/CartPage";

type Pages = {
    loginPage: LoginPage;
    homePage:  HomePage;
    cartPage:  CartPage;
};

export const test = base.extend<Pages>({
    loginPage: async ({ screen, device }, use) => { await use(new LoginPage(screen, device)); },
    homePage:  async ({ screen }, use)          => { await use(new HomePage(screen)); },
    cartPage:  async ({ screen }, use)          => { await use(new CartPage(screen)); },
});

export { expect };
```

**Rules:** one entry per page object; add it to the `Pages` type and the `extend` object. Match each page's constructor args to the base fixtures it needs (`screen`, `device`). Re-export `expect`.

**Checkpoint:** a spec can request `{ loginPage }` and receive a live instance.

---

## Phase 5 — Test data (`testData/`)

**Goal:** externalize inputs.

**File:** `testData/loginData.json`
```json
[
  { "email": "user@example.com", "password": "secret" },
  { "email": "user2@example.com", "password": "secret2" }
]
```

**Rule:** no credentials/inputs hardcoded in specs — always `import` from here.

---

## Phase 6 — Test specs (`tests/`)

**Goal:** business-readable scenarios driven entirely through page objects.

**File:** `tests/login.test.ts`
```ts
import { test } from '../fixtures/test';          // custom fixture, NOT the base runner
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

test.skip('Search Medicine Test', async ({ homePage }) => {
    await homePage.selectCategory('Fever');
    await homePage.swipeList('up', 2000);
    await homePage.openMedicine('Antibiotic');
});

test('Empty Cart Test', async ({ homePage, cartPage }) => {
    await homePage.goToCart();
    await cartPage.emptyCart();
});
```

**Rules:** import from `../fixtures/test`; keep bodies locator/sleep-free; use `beforeEach`/`afterEach` for state setup + isolation; `test.skip` for parked tests.

**Data-driven variant** (generate one test per record):
```ts
for (const data of testData) {
    test(`Login test for ${data.email}`, async ({ loginPage }) => {
        await loginPage.open();
        await loginPage.login(data.email, data.password);
    });
}
```

**Checkpoint:** `npm test` runs green against the device.

---

## Phase 7 — Scratch area (`rough/`) — optional but recommended

**Goal:** a place to prototype raw scripts before refactoring into the POM.

Write throwaway specs importing the **base** `@mobilewright/test` directly, with locators/interactions inlined. Once a flow works, **extract** its locators into a page object's getters and its steps into action methods, then delete or archive the rough version. This repo keeps `rough/login.test.ts` and `rough/datadriven.test.ts` as the "before refactor" reference.

---

## Phase 8 — Documentation

Produce the three companion docs so the framework is self-describing:
- `ARCHITECTURE.md` — layers, file-by-file explanation, API reference.
- `CLAUDE.md` — conventions + gotchas for future AI/dev work.
- `SKILLS.md` — this rebuild blueprint.

---

## Build order summary

```
1. package.json            → npm install
2. mobilewright.config.ts  → device/app wired
3. pages/*.ts              → POM screens (locators + actions)
4. fixtures/test.ts        → inject page objects
5. testData/*.json         → external inputs
6. tests/*.test.ts         → scenarios (via fixtures + pages)
7. rough/*.test.ts         → prototype → refactor (optional)
8. docs                    → ARCHITECTURE / CLAUDE / SKILLS
```

## Golden rules (what makes this framework what it is)

1. **Strict layering:** config → fixtures → pages → tests/data. Tests never touch `screen`/`device` directly.
2. **Locators are getters, actions are methods** — always separated, always in a page object.
3. **Constructor injection** of `screen`/`device`; no globals.
4. **Data lives in JSON**, not in specs.
5. **Encapsulate platform quirks** (text clearing, keyboard dismissal, swipe-to-find) inside page methods so specs stay clean.
6. **Isolation** via `beforeEach` (reach known state) + `afterEach` (reset app).
