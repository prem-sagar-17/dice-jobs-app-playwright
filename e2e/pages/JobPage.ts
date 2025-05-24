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

  async applyForJob(jobRole: string | undefined, jobCard: Locator) {
    let jobPage: Page | null = null;
    let easyApply = false;
    let applied = false;

    try {
      const jobTitleLocator = jobCard.locator('a[data-testid="job-search-job-detail-link"]');
      const jobTitle = await jobTitleLocator.innerText();

      let isRelevant = false;
      if (jobRole?.includes("full stack")) {
        isRelevant = /(java|developer|full stack)/i.test(jobTitle);
      } else if (jobRole?.includes("qa engineer")) {
        isRelevant = /\b(qa|automation|tester|analyst|test|quality\s?assurance|quality\s?engineer)\b/i.test(jobTitle);
      } else {
        throw new Error(`Unsupported job role: ${jobRole}`);
      }

      const parent = await jobCard.evaluateHandle(el => el.parentElement);
      const text = parent ? await parent.evaluate(el => el?.innerText || "") : "";

      if (text.includes("Easy Apply")) easyApply = true;
      if (text.includes("Applied")) applied = true;

      if (!easyApply || applied || !isRelevant) {
        console.log("⏭️ Skipping: Irrelevant job, no Easy Apply, or already applied.");
        return;
      }

      console.log(`🚀 Applying for: ${jobTitle}`);

      [jobPage] = await Promise.all([
        this.page.waitForEvent("popup").catch(() => null),
        jobCard.click(),
      ]);

      if (!jobPage) {
        console.warn("⚠️ Job page opened in the same tab. Skipping popup handling.");
        return;
      }

      const appSubmitted = this.locators.appSubmitted(jobPage);
      const wasSubmitted = await appSubmitted.isVisible().catch(() => false);

      if (wasSubmitted) {
        console.log(`⏭️ Already applied: ${jobTitle}`);
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
      const corpToCorpVisible = await this.scrollToElement(corpToCorpLocator, jobPage);

      if (!corpToCorpVisible) {
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

      console.log("✅ Corp to Corp option visible. Proceeding with Easy Apply...");

      try {
        console.log(`🔄 Attempting Easy Apply for: ${jobTitle}`);

        await this.locators.easyApplyButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.easyApplyButton(jobPage).click();

        await this.locators.nextButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.nextButton(jobPage).click();

        await this.locators.submitButton(jobPage).waitFor({ timeout: 5000 });
        await this.locators.submitButton(jobPage).click();

        await this.locators.applicationSubmittedHeading(jobPage).waitFor({ timeout: 10000 });

        const success = await this.locators.applicationSubmittedHeading(jobPage).isVisible().catch(() => false);
        if (success) {
          console.log(`✅ Successfully applied: ${jobTitle}`);
          this.jobResults.push({
            title: jobTitle,
            alreadyApplied: "❌",
            applied: "✅",
            notApplied: "❌",
            link: jobPage.url() || "N/A",
          });
        } else {
          throw new Error(`Application not confirmed for ${jobTitle}`);
        }
      } catch (error) {
        console.log(`❌ Easy Apply failed: ${jobTitle} - ${(error as Error).message}`);
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
  ): Promise<boolean> {
    for (let i = 0; i < maxScrolls; i++) {
      if (await locator.isVisible()) return true;
      await page.mouse.wheel(0, step);
      await page.waitForTimeout(500);
    }
    return false;
  }

  async exportToExcel(): Promise<void> {
    if (this.jobResults.length === 0) {
      console.log("⚠️ No jobs processed. Skipping Excel export.");
      return;
    }

    console.log("📤 Exporting job results to Excel...");

    const totalApplied = this.jobResults.filter(j => j.applied === "✅").length;
    const totalNotApplied = this.jobResults.filter(j => j.notApplied === "✅").length;
    const totalAlreadyApplied = this.jobResults.filter(j => j.alreadyApplied === "✅").length;

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

    this.jobResults.forEach(job => worksheet.addRow(job));

    const reportFolder = "xlsx-reports";
    const filePath = path.join(reportFolder, "job_applications.xlsx");

    if (!fs.existsSync(reportFolder)) {
      fs.mkdirSync(reportFolder, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(`✅ Job results saved to ${filePath}`);
  }
}
