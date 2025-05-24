import { expect, Locator, Page } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";

export class HomeFunctions {
  readonly page: Page;
  readonly locators: Locators;

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async searchJobs(): Promise<void> {
    await this.locators
      .jobTitleField()
      .fill(process.env.JOB_ROLE || "java full stack developer");
    await this.locators.location().click();
    await this.locators.locationField().fill("united states");
    await this.locators.unitedStatesOption().click();
    await this.locators.searchIcon().click();

    await expect(this.locators.jobSearchResultsContainer()).toBeVisible({
      timeout: 40 * 1000,
    });
    await expect(this.locators.allFilters()).toBeVisible({
      timeout: 40 * 1000,
    });

    await this.locators.allFilters().click();
    const labelText = process.env.DATE_POSTED || "Today";
    await this.locators.postedDate(labelText).click();
    await this.locators.filterSearchCheckbox().click();
    await this.locators.applyFilters().click();

    console.log(`🔎 Job search filters applied. '${labelText}' for 'Third Party'`);
  }

  async GetTotalPages(): Promise<Locator | undefined> {
    if (await this.IsLocatorVisible(this.locators.paginationItems())) {
      console.log("is visible")
      return this.locators.paginationItems();
    } else {
      return undefined;
    }
  }

  async GetJobCards() {
    if (await this.IsLocatorVisible(this.locators.jobCards())) {
      return this.locators.jobCards();
    } else {
      return undefined;
    }
  }

  async GetPageNextButtonLocator() {
    if (await this.IsLocatorVisible(this.locators.pageNextButton())) {
      return this.locators.pageNextButton();
    } else {
      return undefined;
    }
  }

  async GetPageNextButtonVisibility(): Promise<boolean> {
    let pageNextVisible = false;
    let pageNextDisabled = false;
    try {
      pageNextVisible = await this.IsLocatorVisible(this.locators.pageLast());
      await this.page.waitForLoadState("domcontentloaded");

      if (pageNextVisible) {
        const pageNext = this.locators.pageLast();
        pageNextDisabled =
          (await pageNext.getAttribute("aria-disabled")) === "true";
      }
      if (pageNextVisible && !pageNextDisabled) {
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

  async IsLocatorVisible(locator: Locator): Promise<boolean> {
    try {
      await expect(locator.first()).toBeVisible({ timeout: 20 * 1000 });
      return true;
    } catch (error) {
      console.log(`${locator} is not visible`);
    }
    return false;
  }
}
