import { Page } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";

export class HomeFunctions {
  readonly page: Page;
  readonly locators: Locators;

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async searchJobs() {
    await this.locators.jobTitleField().fill(process.env.JOB_ROLE || "java full stack developer");
    await this.locators.location().click();
    await this.locators.locationField().fill("united states");
    await this.locators.unitedStatesOption().click();
    await this.locators.postedTodayRadio().click();
    await this.locators.filterSearchCheckbox().click();

    console.log(`🔎 Job search filters applied. ${process.env.DATE_POSTED} for ${process.env.JOB_ROLE}`);
  }

  async GetPageNumber() {
    return this.locators.paginationItems().all();
  }

  async GetJobCards() {
    return this.locators.jobCards().all();
  }

  async GetPageNextButtonLocator() {
    return this.locators.pageNextButton();
  }

  async GetPageNextButtonVisibility(): Promise<boolean> {
    const pageNext = this.locators.pageNext();

    // Wait for page load
    await this.page.waitForLoadState("domcontentloaded");

    // Check if the "Next Page" button is visible
    return await pageNext
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false); // Returns false if not visible
  }
}
