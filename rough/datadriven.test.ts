import { test, expect } from '@mobilewright/test';
import testData from '../testData/loginData.json';
//trainer@way2automation.com

for(const data of testData) {
  test(`Search Test for ${data.email}`, async ({ device, screen, bundleId }) => {

    const appPackage = 'com.way2automation.medishop';

  await new Promise(resolve => setTimeout(resolve, 10000));

  const emailField = screen.getByTestId('email_id');


  await emailField.tap();
  await emailField.longPress({ duration: 1000 });

  const selectAll = screen.getByText('Select all', { exact: false });
  if (await selectAll.isVisible().catch(() => false)) {
    await selectAll.tap();
    
    await screen.getByText('Cut', { exact: false }).tap();
  }

  await emailField.fill(data.email);
  await screen.getByTestId('password_id').fill(data.password);
  await screen.pressButton('BACK');
  await screen.getByType('android.widget.CheckBox').tap();

  await screen.getByText('Sign In').tap();

  

    await new Promise(resolve => setTimeout(resolve, 10000));
    await device.terminateApp(appPackage);
  });
}
