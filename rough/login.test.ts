import { test, expect } from '@mobilewright/test';
import testData from '../testData/loginData.json';


const appPackage = 'com.way2automation.medishop';
const login = testData[0];

test.beforeEach(async ({ device, screen, }) => {

    await device.launchApp(appPackage);
    await new Promise(resolve => setTimeout(resolve, 10000));
    const emailField = screen.getByTestId('email_id');


    await emailField.tap();
    await emailField.longPress({ duration: 1000 });

    const selectAll = screen.getByText('Select all', { exact: false });
    if (await selectAll.isVisible().catch(() => false)) {
        await selectAll.tap();

        await screen.getByText('Cut', { exact: false }).tap();
    }

    await emailField.fill(login.email);

    const passwordField = screen.getByType('android.widget.EditText').nth(1);
    await passwordField.tap();
    await passwordField.longPress({ duration: 1000 });

    const selectAllPass = await screen.getByText('Select all', { exact: false });

    if (await selectAllPass.isVisible().catch(() => false)) {
        await selectAllPass.tap();

    }


    await device.driver.typeText(login.password);



    await screen.pressButton('BACK');
    await screen.getByType('android.widget.CheckBox').tap();

    await screen.getByText('Sign In').tap();



});

test.afterEach(async ({ device }) => {
    await new Promise(resolve => setTimeout(resolve, 10000));
    await device.terminateApp(appPackage);
});

test.skip('Search Medicine Test', async ({ device, screen, bundleId }) => {




    await screen.getByText('Fever').tap();
    await screen.getByTestId('list_id').swipe({
        direction: 'left',
        timeout: 2000
    });
    await new Promise(resolve => setTimeout(resolve, 10000));
    const target = screen.getByText('Antibiotic');

    while (!(await target.isVisible())) {
        await screen.getByTestId('list_id').swipe({
            direction: 'left',
            timeout: 2000,
        });
    }

    await target.tap();


});



test('Empty Cart Test', async ({ device, screen, bundleId }) => {




    await screen.getByText('Cart').tap();
    const removeButton = screen.getByLabel('Remove');

    while(await removeButton.count() > 0) {
        await removeButton.first().tap();
        await new Promise(resolve => setTimeout(resolve, 1000));
    }





});
