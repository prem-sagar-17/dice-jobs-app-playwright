# 🚀 Job Application Automation using Playwright

This project automates job applications on Dice.com using Playwright. It logs in, searches for jobs, and applies automatically while tracking results in an Excel file.

## 📌 Features

✅ Automated login using credentials from GitHub Secrets  
✅ Searches for jobs based on predefined filters  
✅ Applies only to new job listings (avoids duplicates)  
✅ Handles pagination and continues until all pages are processed  
✅ Generates reports (`job_applications.xlsx`) in `playwright-report/`  

---

## 🛠️ Setup Instructions

### 1️⃣ Install Dependencies
Run the following command to install required packages:

```sh
npm ci
```

### 2️⃣ Set Up GitHub Secrets
In your GitHub repository, go to:

**Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

- `DICE_EMAIL` → Your Dice.com login email  
- `DICE_PASSWORD` → Your Dice.com password  

---

## 🚀 Running Tests Locally

Run Playwright Tests:

```sh
npx playwright test
```

Run Tests with Environment Variables:

```sh
EMAIL=your_email PASSWORD=your_password npx playwright test
```

---

## 📊 Test Reports & Excel Export

- **Test Reports** → Stored in `playwright-report/`
- **Excel Report** → `job_applications.xlsx` is inside `playwright-report/`

To view the test report, run:

```sh
npx playwright show-report
```

---

## 📁 Folder Structure

```bash
📂 e2e/
├── 📂 components/        # Locators   
│   ├── dice-jobs-component.ts
├── 📂 pages/          # Page Object Model (POM) classes 
│   ├── LoginPage.ts
│   ├── HomePage.ts
│   ├── JobPage.ts
├── 📂 tests/           # Playwright tests
│   ├── dice-jobs.spec.ts
├── 📂 playwright-report/  # Test results (HTML + Excel)
├── 📄 package.json
├── 📄 playwright.config.ts
├── 📄 README.md
```

---

## 🛠 Contribution Guide

1. **Fork** the repository  
2. **Create a feature branch**: `git checkout -b feature-name`  
3. **Commit changes**: `git commit -m "Add feature"`  
4. **Push the branch**: `git push origin feature-name`  
5. **Create a Pull Request**  

---

## ❓ Issues & Support

If you encounter any issues, create a **GitHub Issue** 🚀
