import { Page, Locator } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

export class JobFunctions {
  readonly page: Page;
  readonly locators: Locators;
  private jobResults: {
    title: string;
    alreadyApplied: string;
    applied: string;
    notApplied: string;
    link: string;
  }[] = [];

  constructor(page: Page) {
    this.page = page;
    this.locators = new Locators(page);
  }

  async applyForJob(jobCard: Locator) {
    let jobPage: Page | null = null;

    try {
      const link = jobCard.locator("xpath=.//h5//a");
      const jobTitle = await link.innerText();
      const isRelevant = /(java|developer|full stack)/i.test(jobTitle);
      const appliedTextLocator = jobCard
        .locator("span")
        .filter({ hasText: "Applied" })
        .first();

      if ((await appliedTextLocator.isVisible()) || !isRelevant) {
        console.log("⏭️ Skipping: Already applied job found.");
        return;
      }

      console.log(`🚀 Applying for: ${jobTitle}`);

      // Open job in a new tab
      [jobPage] = await Promise.all([
        this.page.waitForEvent("popup").catch(() => null),
        link.click(),
      ]);

      if (!jobPage) {
        console.warn(
          "⚠️ Job page opened in the same tab. Skipping popup handling.",
        );
        return;
      }

      const appsubmitted = this.locators.appSubmitted(jobPage);
      // Wait for page load
      await jobPage.waitForLoadState("domcontentloaded");

      // Check if job application is already submitted
      await appsubmitted
        .waitFor({ state: "visible", timeout: 10000 })
        .catch(() => false);

      if (await appsubmitted.isVisible().catch(() => false)) {
        console.log(`⏭️ Skipping: ${jobTitle} (Job already applied)`);
        this.jobResults.push({
          title: jobTitle,
          alreadyApplied: "✅",
          applied: "❌",
          notApplied: "❌",
          link: jobPage.url() || "N/A",
        });
        return; // ✅ EARLY EXIT
      }

      // Locate "Accepts corp to corp applications"
      const corpToCorpLocator = this.locators.corpToCorp(jobPage);

      // Scroll into view before checking visibility
      await corpToCorpLocator.scrollIntoViewIfNeeded();

      if (!(await corpToCorpLocator.isVisible().catch(() => false))) {
        console.log(`❌ Skipping: ${jobTitle} (Corp to Corp not visible)`);
        this.jobResults.push({
          title: jobTitle,
          alreadyApplied: "❌",
          applied: "❌",
          notApplied: "✅",
          link: jobPage.url() || "N/A",
        });
        return; // ✅ EARLY EXIT
      }

      console.log(
        "✅ 'Accepts corp to corp applications' is visible. Proceeding with application...",
      );

      // ✅ Attempt Easy Apply if available
      try {
        console.log(`🔄 Attempting Easy Apply for: ${jobTitle}`);

        await this.locators.easyApplyButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.easyApplyButton(jobPage).click();

        await this.locators.nextButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.nextButton(jobPage).click();

        await this.locators.submitButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.submitButton(jobPage).click();

        console.log(`✅ Successfully applied: ${jobTitle}`);
        this.jobResults.push({
          title: jobTitle,
          alreadyApplied: "❌",
          applied: "✅",
          notApplied: "❌",
          link: jobPage.url() || "N/A",
        });
      } catch (error) {
        console.log(
          `❌ Easy Apply failed for: ${jobTitle} - ${(error as Error).message}`,
        );
        this.jobResults.push({
          title: jobTitle,
          alreadyApplied: "❌",
          applied: "❌",
          notApplied: "✅",
          link: jobPage.url() || "N/A",
        });
      }
    } catch (error) {
      console.log(`❌ Error applying for job: ${(error as Error).message}`);
    } finally {
      if (jobPage) await jobPage.close();
    }
  }

  async exportToExcel() {
    if (this.jobResults.length === 0) {
      console.log("⚠️ No jobs processed. Skipping Excel export.");
      return;
    }

    console.log("📤 Exporting job results to Excel...");

    // Count totals directly from the stored values
    const totalApplied = this.jobResults.filter(
      (job) => job.applied === "✅",
    ).length;
    const totalNotApplied = this.jobResults.filter(
      (job) => job.notApplied === "✅",
    ).length;
    const totalAlreadyApplied = this.jobResults.filter(
      (job) => job.alreadyApplied === "✅",
    ).length;

    // Add Summary Row
    this.jobResults.push({
      title: "Total",
      applied: totalApplied.toString(),
      notApplied: totalNotApplied.toString(),
      alreadyApplied: totalAlreadyApplied.toString(),
      link: "", // Empty cell for formatting
    });

    const reportFolder = "playwright-report/Excel-report"; // Default Playwright report folder
    const filePath = path.join(reportFolder, "job_applications.xlsx");

    // Ensure the folder exists before writing the file
    if (!fs.existsSync(reportFolder)) {
      fs.mkdirSync(reportFolder, { recursive: true });
    }

    const ws = XLSX.utils.json_to_sheet(this.jobResults);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Job Applications");

    XLSX.writeFile(wb, filePath);
    console.log(`✅ Job results saved to ${filePath}`);
  }
}
