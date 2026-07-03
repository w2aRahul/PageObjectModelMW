# PageObjectModelMW

Mobile test-automation framework for the **Way2Automation MediShop** Android app, built on **[MobileWright](https://www.npmjs.com/package/mobilewright)** (a Playwright-style test runner for native mobile apps) with **TypeScript** and the **Page Object Model (POM)** design pattern.

[![CI](https://github.com/w2aRahul/PageObjectModelMW/actions/workflows/ci.yml/badge.svg)](https://github.com/w2aRahul/PageObjectModelMW/actions/workflows/ci.yml)

---

## Features

- 🧩 **Page Object Model** — one class per screen, locators separated from actions
- 💉 **Fixture-based dependency injection** — page objects auto-injected into tests
- 📄 **Data-driven** — test inputs externalized to JSON
- 📱 **Native Android automation** — driven through MobileWright's `Device` + `Screen` API
- 📊 **Rich reporting** — built-in HTML report **and** [Allure](https://allurereport.org/) report
- ✅ **CI on every push** via GitHub Actions

## Tech Stack

| Concern | Technology |
|--------|------------|
| Test runner | `mobilewright` / `@mobilewright/test` |
| Device API | `@mobilewright/core` (`Device`, `Screen`) |
| Language | TypeScript 5.x |
| Pattern | Page Object Model + fixtures |
| Platform | Android (real device / emulator) |
| App under test | `com.way2automation.medishop` |

## Project Structure

```
PageObjectModelMW/
├── mobilewright.config.ts   # Runner + device configuration
├── pages/                   # Page Object Model classes (LoginPage, HomePage, CartPage)
├── fixtures/test.ts         # Custom fixtures that inject page objects
├── testData/loginData.json  # External data for data-driven tests
├── tests/                   # Production specs (use POM + fixtures)
├── rough/                   # Scratch / reference specs (raw, non-POM)
└── app/                     # The app .apk binary
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full layer-by-layer breakdown, **[CLAUDE.md](./CLAUDE.md)** for coding conventions, and **[SKILLS.md](./SKILLS.md)** for a build-from-scratch blueprint.

## Prerequisites

- **Node.js** 18+ and npm
- An **Android device or emulator** connected and visible to `adb devices`
- The device serial matching `deviceName` in `mobilewright.config.ts`
- The MediShop app installed (or enable `installApps` in the config to push `app/way2automation.apk`)
- **Java 8+** on the `PATH` — required by `allure-commandline` to generate/open the Allure report

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Connect a device and confirm it's visible
adb devices

# 3. Set your device serial in mobilewright.config.ts (deviceName)

# 4. Run the tests
npm test

# 5. Run with an HTML report and open it
npm run test:report
```

## Reporting

Two reporters are configured in `mobilewright.config.ts` and run on every `npm test`:

### HTML report (built-in)
Written to `playwright-report/`. Open it with:
```bash
npm run test:report
```

### Allure report
Every test run writes raw results to `allure-results/` (via the `allure-playwright` reporter). Turn those into a browsable report:

```bash
npm test                 # 1. run tests → produces allure-results/
npm run allure:generate  # 2. build the HTML report into allure-report/
npm run allure:open      # 3. open the generated report in a browser

# …or do generate + serve in one step (temporary server):
npm run allure:serve
```

| Script | Does |
|--------|------|
| `allure:generate` | `allure generate allure-results --clean -o allure-report` |
| `allure:open` | Serves the already-generated `allure-report/` |
| `allure:serve` | Generates a temporary report from `allure-results/` and opens it |

> **Requires Java 8+** on the `PATH` (Allure's CLI is a Java tool). Both `allure-results/` and `allure-report/` are git-ignored — they're regenerated on each run.

## Writing a Test

Tests drive the app through page objects only — no locators or waits in the spec:

```ts
import { test } from '../fixtures/test';
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

test('Empty Cart Test', async ({ homePage, cartPage }) => {
  await homePage.goToCart();
  await cartPage.emptyCart();
});
```

### Adding a new screen

1. Create `pages/<Name>Page.ts` — locators as `private get`ters, actions as `public async` methods, dependencies via constructor injection.
2. Register it as a fixture in `fixtures/test.ts`.
3. Write the spec in `tests/`, driving only through the page object.
4. Put any new inputs in `testData/`.

## Continuous Integration

Every push and pull request triggers the workflow in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml), which installs dependencies and type-checks the framework with `tsc --noEmit`.

> **Note:** On-device end-to-end tests require a connected Android device and cannot run on standard GitHub-hosted runners. CI therefore validates that the TypeScript compiles; run `npm test` locally (or on a self-hosted runner with an attached device) to execute the actual tests.

## Documentation

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Full architecture, file-by-file explanation, API reference |
| [CLAUDE.md](./CLAUDE.md) | Conventions & gotchas for future development |
| [SKILLS.md](./SKILLS.md) | Reproducible blueprint to rebuild the framework from scratch |
