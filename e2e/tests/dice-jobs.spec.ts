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
      // ✅ Login and perform job search
      await loginFunctions.login(EMAIL, PASSWORD);
      await homeFunctions.searchJobs();

      // 📊 Fetch total pages (if more than one)
      const totalPagesCount = await homeFunctions.GetTotalPages();
      console.log(totalPagesCount)
      if (totalPagesCount) {
        const totalPagesText = await totalPagesCount.nth(1).innerText();
        console.log(totalPagesText)
        const totalPages = parseInt(totalPagesText.trim(), 10);
        console.log(totalPages)
        console.log(`Total job pages found - ${totalPages}`);
      } else {
        console.log("Only one job page is available");
      }

      let pageNumber = 1;

      // 🔁 Loop through all job listing pages
      while (true) {
        console.log(`🔄 Processing job listings on page - ${pageNumber++}`);
        let jobCards = await homeFunctions.GetJobCards();

        if (!jobCards || (await jobCards.count()) === 0) {
          console.log("❌ No jobs found on this page. Skipping to next page...");
          break;
        }

        // 🛠️ Process all job cards on the page
        const jobCardsCount = await jobCards.count();
        for (let index = 0; index < jobCardsCount; index++) {
          console.log(`📌 Processing job at index ${index}`);
          const jobCard = jobCards.nth(index);
          await jobFunctions.applyForJob(jobCard);
        }

        // ⏭️ Pagination logic
        const nextButtonVisible = await homeFunctions.GetPageNextButtonVisibility();
        if (!nextButtonVisible) {
          console.log("✅ No more pages to process.");
          break;
        }

        try {
          const nextPageButton = await homeFunctions.GetPageNextButtonLocator();
          if (nextPageButton) {
            console.log("🔄 Moving to the next page...");
            await nextPageButton.click();

            await page.waitForSelector('[data-testid="job-search-job-card-link"]', {
              timeout: 10000,
            });
          } else {
            throw new Error("Next button is not found");
          }
        } catch (error) {
          console.error("❌ Pagination error:", error instanceof Error ? error.message : error);
          break;
        }
      }
    } catch (error) {
      // ⚠️ Global error catch
      console.log(`❌ Error encountered: ${(error as Error).message}`);
      throw error;
    } finally {
      // 📤 Always export to Excel before exit
      console.log("📊 Exporting job applications before exit...");
      await jobFunctions.exportToExcel();
    }
  });
});
