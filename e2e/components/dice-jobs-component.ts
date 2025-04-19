import { Page } from "@playwright/test";

export class Locators {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // 🔹 Login Page Locators
  emailField() {
    return this.page.getByTestId("email-input");
  }

  emainInput() {
    return this.page.getByRole("textbox", { name: "Email *" });
  }

  passwordField() {
    return this.page.getByTestId("password-input");
  }

  passwordInput() {
    return this.page.getByRole("textbox", { name: "Password" });
  }

  signInButton() {
    return this.page.getByTestId("sign-in-button");
  }

  submitPasswordButton() {
    return this.page.getByTestId("submit-password");
  }

  // 🔹 Home/Search Page Locators
  jobTitleField() {
    return this.page.getByRole("combobox", {
      name: "Job title, skill, company,",
    });
  }

  locationField() {
    return this.page.getByRole("combobox", { name: "Location Field" });
  }

  location() {
    return this.page.getByPlaceholder("Location (ex. Denver, remote)");
  }

  unitedStatesOption() {
    return this.page.getByText("United States", { exact: true }).nth(1);
  }

  postedTodayRadio() {
    return this.page.getByRole("radio", {
      name: `${process.env.DATE_POSTED || "Today"}`,
    });
  }

  filterSearchCheckbox() {
    return this.page.getByRole("checkbox", {
      name: "Filter Search Results by Third Party",
    });
  }

  jobCards() {
    return this.page.locator("//div[@class='card search-card']");
  }

  paginationItems() {
    return this.page.locator("ul.pagination li");
  }

  appliedMarkers(jobPage: Page) {
    return jobPage.locator("dhi-status-ribbon").getByText("applied");
  }

  // 🔹 Job Application Locators
  easyApplyButton(jobPage: Page) {
    return jobPage.getByRole("button", { name: "Easy apply" });
  }

  nextButton(jobPage: Page) {
    return jobPage.getByRole("button", { name: "Next" });
  }

  submitButton(jobPage: Page) {
    return jobPage.getByRole("button", { name: "Submit" });
  }

  applicationSubmittedHeading(jobPage: Page) {
    return jobPage.getByRole("heading", {
      name: "Application submitted. We're",
    });
  }

  appSubmitted(jobPage: Page) {
    return jobPage.getByText("Application Submitted");
  }

  corpToCorp(jobPage: Page) {
    return jobPage.locator(
      "//span[@id='employmentDetailChip: Accepts corp to corp applications']"
    );
  }

  pageNextButton() {
    return this.page.getByRole("link", { name: "»" });
  }

  pageNext() {
    return this.page.locator(
      "//li[@class='pagination-next page-item ng-star-inserted disabled']"
    );
  }
}
