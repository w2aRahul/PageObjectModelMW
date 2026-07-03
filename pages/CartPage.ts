import type { Screen } from '@mobilewright/core';

export class CartPage {

    constructor(
        private readonly screen: Screen,
    ) { }


    //----Locator------

    private get removeButtons() {

        return this.screen.getByLabel('Remove');
    }

    //----Action----

    async itemCount() {
        return await this.removeButtons.count();
    }

    async emptyCart() {
        while(await this.itemCount() > 0) {
            await this.removeButtons.first().tap();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }



}