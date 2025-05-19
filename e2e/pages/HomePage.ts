import { expect, Page } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";

export class HomeFunctions {
  readonly page: Page;
  readonly locators: Locators;

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async searchJobs(): Promise<void> {
    await this.locators.jobTitleField().fill(process.env.JOB_ROLE || "java full stack developer");
    await this.locators.location().click();
    await this.locators.locationField().fill("united states");
    await this.locators.unitedStatesOption().click();
    await this.locators.searchIcon().click();

    await expect(this.locators.jobSearchResultsContainer()).toBeVisible({ timeout: 40 * 1000 });
    await expect(this.locators.allFilters()).toBeVisible({ timeout: 40 * 1000 });
    
    await this.locators.allFilters().click();
    await this.locators.postedTodayRadio().click();
    await this.locators.filterSearchCheckbox().click();
    await this.locators.applyFilters().click();

    console.log(`🔎 Job search filters applied. 'Today' for 'Third Party'`);
  }

  async GetTotalPages() {
    return this.locators.paginationItems();
  }

  async GetJobCards() {
    return this.locators.jobCards();
  }

  async GetPageNextButtonLocator() {
    return this.locators.pageNextButton();
  }

  async GetPageNextButtonVisibility(): Promise<boolean> {
    const pageNext = this.locators.pageLast();
    await this.page.waitForLoadState("domcontentloaded");

    try {
      const isVisible = await pageNext.isVisible();
      const isDisabled = (await pageNext.getAttribute("aria-disabled")) === "true";
      if (isVisible && !isDisabled) {
        console.log("✅ Next button is visible and enabled");
        return true;
      } else {
        console.log("❌ Next button is either not visible or disabled");
        return false;
      }
    } catch {
      console.log("❌ Next button not visible within the timeout");
      return false;
    }
  }
}
