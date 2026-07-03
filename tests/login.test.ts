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


test.skip('Search Medicine Test', async ({ homePage }) => {

    await homePage.selectCategory('Fever');
    await homePage.swipeList('up', 2000);
    await homePage.openMedicine('Antibiotic');


});


test('Empty Cart Test', async ({ homePage, cartPage }) => {

    await homePage.goToCart();
    await cartPage.emptyCart();


});
