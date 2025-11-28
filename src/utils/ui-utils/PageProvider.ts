import { Page } from "@playwright/test";

let currentPage: Page | null = null;

export class PageProvider {
  static setPage(page: Page) {
    currentPage = page;
  }

  static get page(): Page {
    if (!currentPage) {
      throw new Error("PageProvider.page accessed before being initialized.");
    }
    return currentPage;
  }

  static clear() {
    currentPage = null;
  }
}