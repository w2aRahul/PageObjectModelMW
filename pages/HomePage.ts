import type { Screen } from '@mobilewright/core';

export class HomePage {

    constructor(
        private readonly screen: Screen,
    ) { }   

    //----Locators------

    private get medicineList() {

        return this.screen.getByTestId('list_id');
    }

    private category(name: string) {
        return this.screen.getByText(name);
    }

    private get cartTab() {

        return this.screen.getByText('Cart');
    }


    //----Actions----

    async selectCategory(name: string) {

        await this.category(name).tap();


    }

    async swipeList(direction: 'left' | 'right' | 'up' | 'down' = 'left', timeout = 2000) {

        await this.medicineList.swipe({
            direction: direction,
            timeout: timeout
        });
    }

    async openMedicine(name: string) {

        const target = this.screen.getByText(name);
        while (!(await target.isVisible())) {
            await this.swipeList('left', 2000);
        }
        await target.tap();
    }

    async goToCart() {
        await this.cartTab.tap();
    }

}