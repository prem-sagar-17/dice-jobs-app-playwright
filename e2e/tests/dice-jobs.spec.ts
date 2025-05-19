import { test } from "@playwright/test";
import { LoginFunctions } from "../pages/LoginPage";
import { HomeFunctions } from "../pages/HomePage";
import { JobFunctions } from "../pages/JobPage";

test.setTimeout(20 * 60 * 1000); // 20 minutes timeout

test.describe("Dice Job Application Automation", () => {
  test("Applying for job", async ({ page }) => {
    const EMAIL = process.env.EMAIL;
    const PASSWORD = process.env.PASSWORD;

    const loginFunctions = new LoginFunctions(page);
    const homeFunctions = new HomeFunctions(page);
    const jobFunctions = new JobFunctions(page);

    try {
      await loginFunctions.login(EMAIL, PASSWORD);
      await homeFunctions.searchJobs();

      const totalPagesLocator = await homeFunctions.GetTotalPages();
      console.log(totalPagesLocator);
      const totalPagesCount = await totalPagesLocator.count();

      if (totalPagesCount === 0) {
        console.log("Only one job page is available");
      } else {
        const totalPagesText = await totalPagesLocator.nth(1).innerText();
        const totalPages = parseInt(totalPagesText.trim(), 10);
        console.log(`Total job pages found - ${totalPages}`);
      }

      let pageNumber = 1;
      let jobCards = await homeFunctions.GetJobCards();
      let jobCardsCount = await jobCards.count();
      console.log(jobCardsCount);

      while (true) {
        console.log(`🔄 Processing job listings on page - ${pageNumber++}`);
        let jobCards = await homeFunctions.GetJobCards();
        let jobCardsCount = await jobCards.count();
        console.log(jobCardsCount);

        if (jobCardsCount === 0) {
          console.log(
            "❌ No jobs found on this page. Skipping to next page..."
          );
          break; // Skip the rest of the loop if no jobs are found
        }

        for (let index = 0; index < jobCardsCount; index++) {
          console.log(`📌 Processing job at index ${index}`);
          const jobCard = jobCards.nth(index);
          console.log(jobCard);
          await jobFunctions.applyForJob(jobCard);
        }

        // Re-fetch job cards after interacting with the page to handle DOM changes
        jobCards = await homeFunctions.GetJobCards();
        jobCardsCount = await jobCards.count();

        // 📌 Handle Pagination
        const nextButtonVisible =
          await homeFunctions.GetPageNextButtonVisibility();
        if (!nextButtonVisible) {
          console.log("✅ No more pages to process.");
          break;
        } else {
          console.log("🔄 Moving to the next page...");
          try {
            await (await homeFunctions.GetPageNextButtonLocator()).click();
            await page.waitForSelector(
              '[data-testid="job-search-job-card-link"]',
              { timeout: 10000 }
            );
            jobCards = await homeFunctions.GetJobCards(); // Re-fetch job cards after page load
            jobCardsCount = await jobCards.count();
          } catch (paginationError) {
            console.log(
              "❌ Error clicking next page button or loading next page:",
              paginationError
            );
            break;
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error encountered: ${(error as Error).message}`);
      throw error;
    } finally {
      console.log("📊 Exporting job applications before exit...");
      await jobFunctions.exportToExcel();
    }
  });
});
