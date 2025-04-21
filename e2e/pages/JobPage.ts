import { Page, Locator } from "@playwright/test";
import { Locators } from "../components/dice-jobs-component";
import * as fs from "fs";
import * as path from "path";
import ExcelJS from "exceljs";

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

      [jobPage] = await Promise.all([
        this.page.waitForEvent("popup").catch(() => null),
        link.click(),
      ]);

      if (!jobPage) {
        console.warn("⚠️ Job page opened in the same tab. Skipping popup handling.");
        return;
      }

      const appsubmitted = this.locators.appSubmitted(jobPage);

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
        return;
      }

      const corpToCorpLocator = this.locators.corpToCorp(jobPage);

      const corpToCorpLocatorVisible = await this.scrollToElement(
        corpToCorpLocator,
        jobPage
      );

      if (!corpToCorpLocatorVisible) {
        console.log(`❌ Skipping: ${jobTitle} (Corp to Corp not visible)`);
        this.jobResults.push({
          title: jobTitle,
          alreadyApplied: "❌",
          applied: "❌",
          notApplied: "✅",
          link: jobPage.url() || "N/A",
        });
        return;
      }

      console.log("✅ 'Accepts corp to corp applications' is visible. Proceeding with application...");

      try {
        console.log(`🔄 Attempting Easy Apply for: ${jobTitle}`);

        await this.locators
          .easyApplyButton(jobPage)
          .waitFor({ timeout: 5 * 1000 });
        await this.locators.easyApplyButton(jobPage).click();

        await this.locators.nextButton(jobPage).waitFor({ timeout: 5 * 1000 });
        await this.locators.nextButton(jobPage).click();

        await this.locators
          .submitButton(jobPage)
          .waitFor({ timeout: 5 * 1000 });
        await this.locators.submitButton(jobPage).click();

        await this.locators
          .applicationSubmittedHeading(jobPage)
          .waitFor({ timeout: 10 * 1000 });

        if (
          await this.locators.applicationSubmittedHeading(jobPage).isVisible()
        ) {
          console.log(`✅ Successfully applied: ${jobTitle}`);
          this.jobResults.push({
            title: jobTitle,
            alreadyApplied: "❌",
            applied: "✅",
            notApplied: "❌",
            link: jobPage.url() || "N/A",
          });
        } else {
          throw new Error(`Error applying for job - ${jobTitle}`);
        }
      } catch (error) {
        console.log(
          `❌ Easy Apply failed for: ${jobTitle} - ${(error as Error).message}`
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

  async scrollToElement(
    locator: Locator,
    page: Page,
    step: number = 200,
    maxScrolls: number = 10
  ) {
    for (let i = 0; i < maxScrolls; i++) {
      if (await locator.isVisible()) {
        return true;
      }
      await page.mouse.wheel(0, step);
      await page.waitForTimeout(500);
    }
    return false;
  }

  async exportToExcel() {
    if (this.jobResults.length === 0) {
      console.log("⚠️ No jobs processed. Skipping Excel export.");
      return;
    }

    console.log("📤 Exporting job results to Excel...");

    const totalApplied = this.jobResults.filter(job => job.applied === "✅").length;
    const totalNotApplied = this.jobResults.filter(job => job.notApplied === "✅").length;
    const totalAlreadyApplied = this.jobResults.filter(job => job.alreadyApplied === "✅").length;

    this.jobResults.push({
      title: "Total",
      applied: totalApplied.toString(),
      notApplied: totalNotApplied.toString(),
      alreadyApplied: totalAlreadyApplied.toString(),
      link: "",
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Job Applications");

    worksheet.columns = [
      { header: "Title", key: "title", width: 40 },
      { header: "Already Applied", key: "alreadyApplied", width: 20 },
      { header: "Applied", key: "applied", width: 15 },
      { header: "Not Applied", key: "notApplied", width: 15 },
      { header: "Link", key: "link", width: 60 },
    ];

    this.jobResults.forEach(job => {
      worksheet.addRow(job);
    });

    const reportFolder = "xlsx-reports";
    const filePath = path.join(reportFolder, "job_applications.xlsx");

    if (!fs.existsSync(reportFolder)) {
      fs.mkdirSync(reportFolder, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Job results saved to ${filePath}`);
  }
}
