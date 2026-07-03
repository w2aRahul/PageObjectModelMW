import type { Device, Screen } from '@mobilewright/core';

export const APP_PACKAGE = 'com.way2automation.medishop';

type Field = ReturnType<Screen['getByTestId']>;


export class LoginPage {

    constructor(
        private readonly screen: Screen,
        private readonly device: Device,

    ) { }


    // ----Locators------

    private get emailField() {

        return this.screen.getByTestId('email_id');
    }


    private get passwordField() {

        return this.screen.getByTestId('password_id');
    }


    private get termsCheckbox() {

        return this.screen.getByType('android.widget.CheckBox');
    }

    private get signInButton() {

        return this.screen.getByText('Sign In');
    }


    //----Actions----


    //Launch of the app and wait for the logic screen to settle
    async open() {

        await this.device.launchApp(APP_PACKAGE);
        await this.waitForLoad();

    }

    async waitForLoad(ms = 10000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }



    /*
    private async clearAndFillEmail(value: string){


    }

    private async clearAndFillPass(value: string){

        
    }*/

    private async clearAndFill(field: Field, value: string) {

        await field.tap();
        await field.longPress({ duration: 1000 });


        const selectAll = this.screen.getByText('Select all', { exact: false });
        if (await selectAll.isVisible().catch(() => false)) {
            await selectAll.tap();

            const cut = await this.screen.getByText('Cut', { exact: false });
            if (await cut.isVisible().catch(() => false)) {
                await cut.tap();
                await field.fill(value);
            } else {

                await this.device.driver.typeText(value);
            }
            return;
        }

        await field.fill(value);


    }


    async enterEmail(email: string) {

        await this.clearAndFill(this.emailField, email);

    }


    async enterPassword(password: string) {

        await this.clearAndFill(this.passwordField, password);

    }


    async acceptTermsandSubmit() {

        await this.screen.pressButton('BACK');
        await this.termsCheckbox.tap();
        await this.signInButton.tap();

    }

    async login(email: string, password: string){

        await this.enterEmail(email);
        await this.enterPassword(password);
        await this.acceptTermsandSubmit();
        await this.waitForLoad();

    }



}


