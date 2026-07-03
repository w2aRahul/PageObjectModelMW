import { test as base, expect } from "@mobilewright/test";
import { LoginPage } from "../pages/LoginPage";
import { HomePage } from "../pages/HomePage";
import { CartPage } from "../pages/CartPage";


type Pages = {

    loginPage : LoginPage;
    homePage : HomePage;
    cartPage : CartPage;


}


export const test = base.extend<Pages>({
    loginPage: async({screen,device},use)=>{
        await use(new LoginPage(screen,device));
    },
    homePage: async({screen},use)=>{
        await use(new HomePage(screen));
    },
    cartPage: async({screen},use)=>{
        await use(new CartPage(screen));
    }




});

export{expect};