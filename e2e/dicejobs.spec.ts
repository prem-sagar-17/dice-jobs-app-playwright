import { test, expect, type Page, type Locator } from "@playwright/test";

test.setTimeout(90000); // 90 seconds timeout

test("Applying for job", async ({ page }) => {
  // Credentials (Avoid hardcoding in production)
  const EMAIL = "premsagar1078@gmail.com";
  const PASSWORD = "Prem@1997";

  let jobCount = 1;
  const jobsApplied: string[] = [];
  const jobsNotApplied: string[] = [];
  const toBeApplied: string[] = [];
  let jobPage: Page | null = null;

  async function login() {
    await page.goto("https://www.dice.com/dashboard/login");
    await page.getByTestId("email-input").waitFor({ state: "visible" });
    await page.getByRole("textbox", { name: "Email *" }).fill(EMAIL);
    await page.getByTestId("sign-in-button").click();

    await page.getByTestId("password-input").waitFor({ state: "visible" });
    await page.getByRole("textbox", { name: "Password" }).fill(PASSWORD);
    await page.getByTestId("submit-password").click();
    await page.waitForURL("https://www.dice.com/home-feed");
    console.log("✅ Logged in successfully.");
  }

  async function searchJobs() {
    await page.getByRole("combobox", { name: "Job title, skill, company," }).fill("java full stack developer");
    await page.getByPlaceholder("Location (ex. Denver, remote)").click();
    await page.getByRole("combobox", { name: "Location Field" }).fill("united states");
    await page.getByText("United States", { exact: true }).nth(1).click();
    await page.getByRole("radio", { name: "Today" }).click();
    await page.getByRole("checkbox", { name: "Filter Search Results by Third Party" }).click();
    console.log("🔎 Job search filters applied.");
  }

  async function applyForJob(jobCard: Locator, index: number) {
    try {
      const link = jobCard.locator("xpath=.//h5//a");
      const jobTitle = await link.innerText();
      const isRelevant = /(java|developer|full stack)/i.test(jobTitle);
      const alreadyApplied = (await jobCard.locator("span.ribbon-inner").count()) > 0;

      if (alreadyApplied || !isRelevant) return;

      console.log(`🚀 Applying for: ${jobTitle}`);

      // Close previous job page
      if (jobPage && !jobPage.isClosed()) {
        await jobPage.close();
      }

      // Open job page
      [jobPage] = await Promise.all([page.waitForEvent("popup").catch(() => null), link.click()]);

      if (!jobPage) {
        console.warn("⚠️ Job page opened in the same tab. Skipping popup handling.");
        return;
      }

      await jobPage.waitForLoadState("domcontentloaded");

      // Check if already applied
      const applicationViewed = await jobPage.locator("application-viewed").elementHandle();
      if (applicationViewed) {
        const shadowRootHandle = await applicationViewed.evaluateHandle((el) => el.shadowRoot);
        const isSubmitted = await shadowRootHandle?.evaluate((root) => {
          if (!root) return false; // Ensure root is not null
          return Array.from(root.querySelectorAll("*")).some((el) =>
            el.textContent?.includes("Application Submitted")
          );
        });

        if (isSubmitted) {
          console.log(`✅ Already applied: ${jobCount++}`);
          jobsApplied.push(jobPage.url());
          return;
        }
      }

      if (await jobPage.getByRole("heading", { name: "You're being redirected to an" }).isVisible()) {
        console.log(`🔄 Redirected job: ${jobCount++}`);
        toBeApplied.push(jobPage.url());
      } else if (await jobPage.getByText("Accepts corp to corp").isVisible()) {
        await jobPage.getByRole("button", { name: "Easy apply" }).click();
        await jobPage.waitForLoadState("load");

        for (let i = 0; i < 3; i++) {
          const submitButton = jobPage.locator("//button[@class='seds-button-primary btn-next']");
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await jobPage.waitForLoadState("load");
          }
        }

        if (await jobPage.getByRole("heading", { name: "Application submitted. We're" }).isVisible()) {
          console.log(`✅ Job applied: ${jobCount++}`);
          jobsApplied.push(jobPage.url());
        } else {
          console.log(`❌ Job not applied`);
          jobsNotApplied.push(jobPage.url());
        }
      }

      // Close job popup
      if (jobPage && !jobPage.isClosed()) {
        await jobPage.close();
      }
      await page.bringToFront();
    } catch (e) {
      if (jobPage && !jobPage.isClosed()) {
        await jobPage.close();
      }
      await page.bringToFront();
      console.log(`❌ Job not applied due to error: ${e.message}`);
      jobsNotApplied.push(page.url());
    }
  }

  await login();
  await searchJobs();

  // Job Listings Pagination
  while (true) {
    console.log("🔄 Processing job listings...");
    let jobCards = await page.locator("(//div[@class='card search-card'])").all();

    for (let index = 0; index < Math.min(3, jobCards.length); index++) {
      await applyForJob(jobCards[index], index);
    }

    // Check if "Next" button is disabled
    const nextButton = page.locator("li.pagination-next a.page-link");
    if ((await nextButton.locator("xpath=..").getAttribute("class"))?.includes("disabled")) {
      console.log("✅ Reached last page. Stopping.");
      break;
    }

    // Click "Next" to go to the next page
    console.log("➡️ Navigating to the next page...");
    await nextButton.click();
    await page.waitForLoadState("domcontentloaded");
  }

  console.log(`✅ Total Jobs Applied: ${jobsApplied.length}`);
  console.log(`❌ Total Jobs Not Applied: ${jobsNotApplied.length}`);
  console.log(`🔄 Total Redirected Jobs: ${toBeApplied.length}`);
});
