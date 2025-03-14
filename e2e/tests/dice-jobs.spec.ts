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

      let pageNumber = 1

      while (true) {
        console.log(`🔄 Processing job listings on page - ${pageNumber++}`);

        let jobCards = await page
          .locator("//div[@class='card search-card']")
          .all();

        for (let index = 0; index < jobCards.length; index++) {
          console.log(`📌 Processing job at index ${index}`);
          await jobFunctions.applyForJob(jobCards[index]);

          // 🔄 Re-fetch job cards after returning from popup to handle DOM changes
          jobCards = await page
            .locator("//div[@class='card search-card']")
            .all();
        }

        // 📌 Handle Pagination
        if (await homeFunctions.GetPageNextButtonVisibility()) {
          console.log("✅ No more pages to process.");
          break;
        } else {
          console.log("🔄 Moving to the next page...");
          (await homeFunctions.GetPageNextButtonLocator()).click();
          await page.waitForLoadState("domcontentloaded");
        }
      }
    } catch (error) {
      console.log(`❌ Error encountered: ${(error as Error).message}`);
    } finally {
      console.log("📊 Exporting job applications before exit...");
      await jobFunctions.exportToExcel();
    }
  });
});
