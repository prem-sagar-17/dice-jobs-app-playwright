import { expect, Locator, Page } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";

export class HomeFunctions {
  readonly page: Page;
  readonly locators: Locators;

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async searchJobs(jobRole: string | undefined): Promise<void> {
    if (!jobRole) {
      throw new Error("❌ Job title is undefined.");
    }

    await this.locators.jobTitleField().fill(jobRole);

    await this.locators.location().click();
    await this.locators.locationField().fill("united states");
    await this.locators.unitedStatesOption().click();
    await this.locators.searchIcon().click();

    await expect(this.locators.jobSearchResultsContainer()).toBeVisible({
      timeout: 40000,
    });
    await this.acceptConsentIfVisible();
    await expect(this.locators.allFilters()).toBeVisible({
      timeout: 40000,
    });
    await this.dismissPopupIfVisible();
    await this.locators.allFilters().click();

    const labelText = process.env.DATE_POSTED || "Today";
    await this.locators.postedDate(labelText).click();
    await this.locators.filterSearchCheckbox().click();
    await this.locators.applyFilters().click();
    await this.page.waitForTimeout(10 * 1000);

    console.log(
      `🔎 Job search filters applied: '${labelText}' with 'Third Party'`
    );
  }

  async GetTotalPages(): Promise<string | null | undefined> {
    if (await this.IsLocatorVisible(this.locators.paginationItems())) {
      console.log("✅ Pagination items are visible.");
      return await this.locators.paginationItems().nth(1).textContent();
    }
    return undefined;
  }

  async GetJobCards(): Promise<Locator | undefined> {
    if (await this.IsLocatorVisible(this.locators.jobCards())) {
      return this.locators.jobCards();
    }
    return undefined;
  }

  async GetPageNextButtonLocator(): Promise<Locator | undefined> {
    if (await this.IsLocatorVisible(this.locators.pageNextButton())) {
      return this.locators.pageNextButton();
    }
    return undefined;
  }

  async GetPageNextButtonVisibility(): Promise<boolean> {
    try {
      const isVisible = await this.IsLocatorVisible(this.locators.pageLast());
      await this.page.waitForLoadState("domcontentloaded");

      if (isVisible) {
        const pageNext = this.locators.pageLast();
        const isDisabled =
          (await pageNext.getAttribute("aria-disabled")) === "true";

        if (!isDisabled) {
          console.log("✅ Next button is visible and enabled.");
          return true;
        }
      }

      console.log("❌ Next button is either not visible or disabled.");
      return false;
    } catch {
      console.log("❌ Next button not visible within the timeout.");
      return false;
    }
  }

  async IsLocatorVisible(locator: Locator): Promise<boolean> {
    try {
      await expect(locator.first()).toBeVisible({ timeout: 20000 });
      return true;
    } catch {
      console.log(`⚠️ Locator is not visible: ${locator}`);
      return false;
    }
  }

  async dismissPopupIfVisible(): Promise<void> {
    const dismissLocator = this.locators.dismissPopUp();
    const isVisible = await dismissLocator.isVisible();

    if (isVisible) {
      console.log("⚠️ Dismiss popup detected. Clicking...");
      await dismissLocator.click();
      await this.page.waitForTimeout(1000);
    } else {
      console.log("✅ No dismiss popup detected.");
    }
  }

  async acceptConsentIfVisible(): Promise<void> {
    const consentLocator = this.locators.acceptAllButton();

    if (await consentLocator.isVisible()) {
      console.log("⚠️ Consent popup detected. Clicking...");
      await consentLocator.click();
      await this.page.waitForTimeout(1000);
    } else {
      console.log("✅ No consent popup detected.");
    }
  }
}
