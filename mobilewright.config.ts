import { defineConfig } from 'mobilewright';

export default defineConfig({
  platform: 'android',
  bundleId: 'com.way2automation.medishop',
  deviceName: 'R3CT204N57L',
  //installApps: './app/way2automation.apk',
  autoAppLaunch: true,
  reporter: 'html',


  //  workers: 2,
  // fullyParallel: true,

  // projects: [
  //   {
  //     name: 'Samsung-RealDevice',
  //     use: {
  //       platform: 'android',
  //       deviceName: 'R3CT204N57L',
  //       bundleId: 'com.way2automation.medishop',
  //       installApps: './app/way2automation.apk',
  //       autoAppLaunch: true,
  //     },
  //   },
  //   {
  //     name: 'Emulator',
  //     use: {
  //       platform: 'android',
  //       deviceName: 'emulator-5554',
  //       bundleId: 'com.way2automation.medishop',
  //       installApps: './app/way2automation.apk',
  //       autoAppLaunch: true,
  //     },
  //   },
  // ],
  timeout: 90_000,
});