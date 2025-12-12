# Playwright Salesforce Automation Framework

A comprehensive end-to-end testing framework built with **Playwright** and **TypeScript** for automating Salesforce UI and API workflows. This framework demonstrates enterprise-grade test automation practices including Page Object Model (POM), test data management, parallel execution, and cloud-based credential management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Organization](#test-organization)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [AWS Integration](#aws-integration)
- [Contributing](#contributing)

---

## Overview

This Playwright framework automates testing for **Salesforce** modules including:
- **Contact Management** - Create, fetch, and update contact records
- **Case Management** - Create and update case records
- **Authentication** - OAuth2 client credentials flow with OTP verification

The framework supports **both UI and API** testing with:
- **Parallel test execution** across multiple workers
- **Environment-specific configurations** (Dev, SIT, UAT)
- **AWS Secrets Manager integration** for secure credential management
- **Comprehensive logging** for parallel test execution
- **Data-driven testing** with synthetic and dynamic test data

---

## Key Features

✅ **Page Object Model (POM)** - Maintainable, reusable page components  
✅ **Dual Testing Modes** - UI tests via Playwright + API tests via HTTP  
✅ **Parallel Execution** - Multi-worker support with user locking mechanism  
✅ **Secure Credentials** - AWS Secrets Manager integration  
✅ **OTP Support** - Gmail API integration for two-factor authentication  
✅ **Test Tagging** - SMOKE and REGRESSION test categorization  
✅ **Annotations** - Feature and priority metadata for test reporting  
✅ **TypeScript** - Full type safety across the framework  
✅ **Multiple Environments** - Dev, SIT, UAT configuration support  
✅ **Infrastructure as Code** - AWS CDK for role management  
✅ **AI-Assisted Test Generation** - Prompt-based test creation and enhancement using Claude AI  

---

## 🤖 AI-Assisted Testing with Prompts

The framework includes **prompt templates** to leverage Claude AI for test generation and enhancement:

### Available Prompts

| Prompt | Purpose | Output |
|--------|---------|--------|
| **generate-test.md** | Generate complete test skeletons from Salesforce specifications | Playwright test code |
| **add-assertions.md** | Enhance existing tests with comprehensive assertions | Enhanced test with validations |
| **fix-test.md** | Identify and fix failing tests with explanations | Fixed test code + analysis |
| **suggest-coverage.md** | Suggest test scenarios for better coverage | Test case recommendations |

### Example Workflow

1. **Generate Test** - Use `generate-test.md` prompt with Salesforce API specs
2. **Add Assertions** - Use `add-assertions.md` prompt to enhance validation
3. **Fix Issues** - Use `fix-test.md` prompt when tests fail
4. **Improve Coverage** - Use `suggest-coverage.md` prompt for gap analysis

### Usage

Copy the relevant prompt file content and use it with Claude AI:
- Provide test specifications or existing test code
- Claude generates/fixes/enhances the test according to the prompt constraints
- Copy generated code into your test file
- Run tests to validate

---

## Project Structure

```
playwright-framework-poc/
├── src/
│   ├── actions/
│   │   ├── case-actions/
│   │   │   └── CaseCreation.ts          # Case creation workflows
│   │   └── contact-actions/
│   │       └── ContactCreation.ts       # Contact creation workflows
│   │
│   ├── data/
│   │   ├── constants/
│   │   │   ├── app-routes.ts            # Application route definitions
│   │   │   ├── form-fields.ts           # Form field selectors
│   │   │   └── query-constants.ts       # SOQL query definitions
│   │   ├── enums/
│   │   │   ├── data-sources.enums.ts    # Test data source types
│   │   │   ├── modules.enums.ts         # Salesforce modules
│   │   │   ├── test-tags.enums.ts       # Test categorization (SMOKE/REGRESSION)
│   │   │   └── user-profiles.enums.ts   # User roles and profiles
│   │   └── json/
│   │       ├── case-synthetic.json      # Synthetic case test data
│   │       └── contact-synthetic.json   # Synthetic contact test data
│   │
│   ├── fixtures/
│   │   ├── api-fixtures.ts              # Authenticated API client fixture
│   │   ├── pom-fixtures.ts              # Page Object Model fixtures
│   │   └── worker-context.ts            # Per-worker browser context management
│   │
│   ├── helpers/
│   │   └── gmail-otp-api.ts             # Gmail API integration for OTP retrieval
│   │
│   ├── pages/
│   │   ├── BasePage.ts                  # Abstract base for all page objects
│   │   ├── LoginPage.ts                 # Login functionality with OTP support
│   │   ├── CasePage.ts                  # Case management page object
│   │   └── ContactPage.ts               # Contact management page object
│   │
│   ├── tests/
│   │   ├── api-tests/
│   │   │   ├── case-soql.spec.ts        # Case API tests (SOQL queries)
│   │   │   └── contact-soql.spec.ts     # Contact API tests (SOQL queries)
│   │   └── ui-tests/
│   │       ├── case-module-tests/
│   │       │   └── case-creation.spec.ts
│   │       ├── contact-module-tests/
│   │       │   └── contact-creation.spec.ts
│   │       └── login-module-tests/
│   │           └── login.spec.ts
│   │
│   ├── utils/
│   │   ├── api-utils/
│   │   │   └── SalesforceApiClient.ts   # OAuth2 API client (Client Credentials)
│   │   ├── aws-utils/
│   │   │   ├── AwsSecrets.ts            # AWS Secrets Manager integration
│   │   │   └── UserLock.ts              # Distributed user locking for parallel tests
│   │   ├── data-utils/
│   │   │   ├── RulesEngine.ts           # Data validation rules
│   │   │   └── TestDataFactory.ts       # Dynamic test data generation
│   │   ├── log-utils/
│   │   │   └── ParallelExecutionLogger.ts # Worker-aware logging
│   │   ├── login-utils/
│   │   │   └── LoginUtil.ts             # Login helper utilities
│   │   ├── ui-utils/
│   │   │   └── PageProvider.ts          # Singleton page instance provider
│   │   └── session-utils.ts             # Browser session management
│   │
│   └── validations/
│       ├── CaseValidations.ts           # Case data validation assertions
│       ├── ContactValidations.ts        # Contact data validation assertions
│       ├── GenericValidations.ts        # Common validation utilities
│       └── LoginValidations.ts          # Login flow validation assertions
│
├── cdk/                                  # AWS CDK Infrastructure
│   ├── bin/
│   │   └── cdk.ts                       # CDK app entry point
│   ├── lib/
│   │   └── secrets-role-stack.ts        # IAM role for Secrets Manager access
│   └── cdk.json                         # CDK configuration
│
├── playwright-report/                    # Test execution reports
├── test-results/                         # Test result artifacts
├── prompts/                              # AI prompt templates
├── playwright.config.ts                  # Playwright configuration
├── tsconfig.json                         # TypeScript configuration
├── package.json                          # Dependencies and scripts
└── README.md                             # This file
```

---

## Technologies

| Technology | Purpose |
|-----------|---------|
| **Playwright** | Cross-browser automation framework |
| **TypeScript** | Type-safe test code |
| **Axios** | HTTP client for API testing |
| **AWS SDK** | Secrets Manager & DynamoDB integration |
| **Google APIs** | Gmail OTP retrieval |
| **AWS CDK** | Infrastructure as Code for role management |
| **Node-RSA** | RSA encryption for secure credential handling |
| **dotenv** | Environment variable management |

---

## Setup & Installation

### Prerequisites

- **Node.js** 18+ and npm
- **AWS Account** with Secrets Manager access
- **Salesforce Org** with API enabled
- **Gmail Account** (for OTP-based tests)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/krutiunnithan/playwright-automation-framework
   cd playwright-framework-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Required `.env` variables:
   ```
   TEST_ENVIRONMENT_VALUE=dev          # Environment: dev, sit, uat
   AWS_REGION=ap-southeast-2
   AWS_ACCOUNT_ID=123456789
   AWS_SECRETS_ROLE_ARN=arn:aws:iam::...
   TEST_TIMEOUT_MS=180000              # Test timeout in milliseconds
   OTP_FETCH_TIMEOUT_MS=120000         # OTP fetch timeout
   ```

4. **Deploy AWS infrastructure (optional)**
   ```bash
   cd cdk
   npm install
   npx cdk deploy
   ```

---

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Multiple Environments** - Dev, SIT, UAT with separate base URLs
- **Browser Configuration** - Chromium, Firefox, WebKit support
- **Parallel Workers** - Configurable worker count for parallel execution
- **Timeouts** - Customizable test and OTP fetch timeouts

### Example Base URL Configuration

```typescript
const BASE_URLS = {
  dev: {
    ui: 'https://orgfarm-dev-ed.develop.lightning.force.com',
    api: 'https://orgfarm-dev-ed.develop.lightning.force.com/services/data/v60.0',
  },
  sit: {
    ui: 'https://sit-orgfarm-dev-ed.develop.lightning.force.com',
    api: 'https://sit-orgfarm-dev-ed.develop.lightning.force.com/services/data/v60.0',
  },
  uat: {
    ui: 'https://uat-orgfarm-dev-ed.develop.lightning.force.com',
    api: 'https://uat-orgfarm-dev-ed.develop.lightning.force.com/services/data/v60.0',
  },
};
```

---

## Running Tests

### Run All Tests
```bash
npm run test:parallel
```

### Run Specific Test Suite
```bash
npx playwright test src/tests/ui-tests/contact-module-tests/
```

### Run Tests with Specific Tag
```bash
npx playwright test --grep @Smoke
```

### Run with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Generate HTML Report
```bash
npx playwright show-report
```

---

## Test Organization

### UI Tests
Tests that interact with Salesforce UI through Page Objects:
- **Login Tests** - Authentication and OTP verification
- **Contact Creation** - Create and manage contact records
- **Case Creation** - Create and manage case records

### API Tests
Direct Salesforce API testing using SOQL queries:
- **Case SOQL Tests** - Create, read, and update cases via API
- **Contact SOQL Tests** - Create, read, and update contacts via API

### Test Structure
Each test includes:
- **Test Tags** - `@Smoke`, `@Regression` for categorization
- **Annotations** - Feature and Priority metadata
- **Step Comments** - Clear documentation of test steps
- **Assertions** - Data validation at each step

---

## Architecture & Design Patterns

### 1. **Page Object Model (POM)**
All UI interactions are abstracted into page classes:
- **BasePage** - Abstract base with common utilities
- **LoginPage** - Authentication with OTP support
- **ContactPage** - Contact record management
- **CasePage** - Case record management

### 2. **Fixtures**
Playwright fixtures provide test dependencies:
- **API Fixtures** - Authenticated Salesforce API client
- **POM Fixtures** - Page Object instances with browser lifecycle
- **Worker Context** - Per-worker browser isolation for parallel execution

### 3. **Test Data Management**
- **TestDataFactory** - Generate dynamic test data
- **Data Enums** - Centralized constant definitions
- **Synthetic JSON** - Predefined test data sets
- **Rules Engine** - Data validation rules

### 4. **Authentication & Security**
- **OAuth2 Client Credentials** - Server-to-server API authentication
- **AWS Secrets Manager** - Centralized credential storage
- **User Locking** - Prevent parallel test conflicts
- **Gmail OTP API** - Two-factor authentication support

### 5. **Parallel Execution**
- **Worker Context** - Per-worker browser instances
- **User Locking** - Distributed DynamoDB-based user locks
- **Parallel Logger** - Worker-aware log aggregation

---

## AWS Integration

### Secrets Manager
Stores and retrieves:
- Salesforce OAuth credentials
- User account credentials (by profile and environment)
- Gmail OAuth tokens for OTP retrieval

### Infrastructure as Code (CDK)
Deploys:
- IAM role for Secrets Manager access
- DynamoDB table for user locking

### Environment Configuration
```typescript
const roleArn = process.env.AWS_SECRETS_ROLE_ARN!;
const secretsManager = await assumeRole(roleArn);
```

---

## Key Classes & Modules

### Core Test Classes
- **SalesforceApiClient** - OAuth2 authenticated API client
- **BasePage** - Base for all page objects
- **TestDataFactory** - Test data generation
- **RulesEngine** - Data validation rules

### Utilities
- **AwsSecrets** - Secrets Manager integration
- **UserLock** - Distributed user locking
- **ParallelExecutionLogger** - Multi-worker logging
- **PageProvider** - Singleton page instance management
- **LoginUtil** - Login helper methods
- **SessionUtils** - Session management

---

## Typical Test Flow

### UI Test Flow
1. **Initialize** - Browser, page objects, fixtures
2. **Login** - Authenticate with credentials + OTP
3. **Execute** - Interact with Salesforce UI
4. **Validate** - Assert expected outcomes
5. **Cleanup** - Release user lock, close browser

### API Test Flow
1. **Authenticate** - Obtain OAuth token
2. **Execute** - SOQL queries or record operations
3. **Validate** - Assert API responses
4. **Cleanup** - Release resources

---

## Contributing

1. Follow TypeScript and POM patterns
2. Add step comments to test bodies
3. Use test tags (@Smoke, @Regression)
4. Include annotations (Feature, Priority)
5. Update this README if adding new modules

---

## License

ISC

---

## Version

**1.0.0** - Initial Salesforce automation framework
