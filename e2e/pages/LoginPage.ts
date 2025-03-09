import { Page } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";

export class LoginFunctions {
  readonly page: Page;
  readonly locators: Locators;

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async login(email: string, password: string) {
    await this.page.goto("https://www.dice.com/dashboard/login");
    await this.locators.emailField().waitFor({ state: "visible" });
    await this.locators.emainInput().fill(email);
    await this.locators.signInButton().click();

    await this.locators.passwordField().waitFor({ state: "visible" });
    await this.locators.passwordInput().fill(password);
    await this.locators.submitPasswordButton().click();
    await this.page.waitForURL("https://www.dice.com/home-feed");

    console.log("✅ Logged in successfully.");
  }
}
