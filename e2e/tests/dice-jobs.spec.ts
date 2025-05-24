import { test } from "@playwright/test";
import { LoginFunctions } from "../pages/LoginPage";
import { HomeFunctions } from "../pages/HomePage";
import { JobFunctions } from "../pages/JobPage";

test.setTimeout(20 * 60 * 1000); // 20 minutes timeout

test.describe("Dice Job Application Automation", () => {
  test("Applying for job", async ({ page }) => {
    const EMAIL = process.env.EMAIL;
    const PASSWORD = process.env.PASSWORD;
    const JOB_ROLE = process.env.JOB_ROLE;

    if (!EMAIL || !PASSWORD || !JOB_ROLE) {
      throw new Error("❌ EMAIL, PASSWORD, or JOB_ROLE is not set in environment variables.");
    }

    const loginFunctions = new LoginFunctions(page);
    const homeFunctions = new HomeFunctions(page);
    const jobFunctions = new JobFunctions(page);

    try {
      console.log("🔐 Logging in...");
      await loginFunctions.login(EMAIL, PASSWORD);

      console.log(`🔍 Searching jobs for: ${JOB_ROLE}`);
      await homeFunctions.searchJobs(JOB_ROLE);

      const totalPagesCount = await homeFunctions.GetTotalPages();
      if (totalPagesCount) {
        const totalPages = parseInt(totalPagesCount.trim(), 10);
        console.log(`📄 Total job pages found: ${totalPages}`);
      } else {
        console.log("📄 Only one job page available.");
      }

      let pageNumber = 1;

      while (true) {
        console.log(`🔄 Processing job listings on page: ${pageNumber++}`);
        const jobCards = await homeFunctions.GetJobCards();

        if (!jobCards || (await jobCards.count()) === 0) {
          console.log("❌ No jobs found on this page. Skipping to next...");
          break;
        }

        const jobCardsCount = await jobCards.count();
        for (let index = 0; index < jobCardsCount; index++) {
          console.log(`📌 Processing job card at index: ${index}`);
          const jobCard = jobCards.nth(index);
          await jobFunctions.applyForJob(JOB_ROLE, jobCard);
        }

        const nextButtonVisible = await homeFunctions.GetPageNextButtonVisibility();
        if (!nextButtonVisible) {
          console.log("✅ No more pages to process.");
          break;
        }

        try {
          const nextPageButton = await homeFunctions.GetPageNextButtonLocator();
          if (nextPageButton) {
            console.log("⏭️ Moving to the next page...");
            await nextPageButton.click();

            await page.waitForSelector('[data-testid="job-search-job-card-link"]', {
              timeout: 10000,
            });
          } else {
            throw new Error("⛔ Next page button is missing.");
          }
        } catch (paginationError) {
          console.error(
            `❌ Pagination error: ${paginationError instanceof Error ? paginationError.message : paginationError}`
          );
          break;
        }
      }
    } catch (error) {
      console.error(`❌ Global error: ${(error as Error).message}`);
      throw error;
    } finally {
      console.log("📤 Exporting applied jobs to Excel...");
      await jobFunctions.exportToExcel();
    }
  });
});
