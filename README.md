# **Job Application Automation using Playwright**

This project automates job applications on Dice.com using **Playwright**. It logs in, searches for jobs, and applies automatically while tracking results in an Excel file.

## **📌 Features**
- ✅ Automated login using credentials from **GitHub Secrets**  
- ✅ Searches for jobs based on predefined filters  
- ✅ Applies only to **new** job listings  
- ✅ Handles pagination and continues until all pages are processed  
- ✅ Generates a report (`job_applications.xlsx`) inside the `playwright-report/` folder  

---

## **🛠️ Setup Instructions**

### **1️⃣ Install Dependencies**
Run the following command to install required packages:

```sh
npm ci
2️⃣ Set Up GitHub Secrets
In your GitHub repository, go to:
Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

DICE_EMAIL → Your Dice.com login email
DICE_PASSWORD → Your Dice.com password
🚀 Running Tests Locally
Login & Apply for Jobs
sh
Copy
Edit
npx playwright test
Run Tests with Environment Variables
sh
Copy
Edit
EMAIL=your_email PASSWORD=your_password npx playwright test
📊 Test Report & Excel Export
Test Reports → Saved in playwright-report/
Excel Report (job_applications.xlsx) is also stored inside playwright-report/
To view the report:

sh
Copy
Edit
npx playwright show-report
🛠️ GitHub Actions (CI/CD)
This project runs automatically using GitHub Actions.

Workflow Configuration (.github/workflows/playwright.yml)
yaml
Copy
Edit
name: Job Application Automation

on:
  schedule:
    - cron: "0 3 * * *"  # Runs every day at 3 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install Dependencies
        run: npm ci

      - name: Run Playwright Tests
        env:
          EMAIL: ${{ secrets.DICE_EMAIL }}
          PASSWORD: ${{ secrets.DICE_PASSWORD }}
        run: npx playwright test

      - name: Upload Test Reports
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
📝 Folder Structure
bash
Copy
Edit
📂 e2e/
 ├── 📂 pages/            # Page Object Model (POM) classes
 │    ├── LoginPage.ts
 │    ├── HomePage.ts
 │    ├── JobPage.ts
 ├── 📂 tests/            # Playwright tests
 │    ├── dice-jobs.spec.ts
 ├── 📂 playwright-report/  # Test results (HTML + Excel)
 ├── 📄 package.json
 ├── 📄 playwright.config.ts
 ├── 📄 README.md
👨‍💻 Contribution
Fork the repository
Create a feature branch (git checkout -b feature-name)
Commit changes (git commit -m "Add feature")
Push the branch (git push origin feature-name)
Open a Pull Request
❓ Issues & Support
If you encounter any issues, create a GitHub Issue. 🚀

markdown
Copy
Edit

This **README.md** file is **GitHub-friendly** and ready for direct use. 🚀