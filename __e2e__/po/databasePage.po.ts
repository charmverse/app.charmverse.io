import type { Locator, Page } from '@playwright/test';

import type { PropertyType } from 'lib/focalboard/board';

import { GlobalPage } from './global.po';

export class DatabasePage extends GlobalPage {
  readonly selectNewDatabaseAsSource: Locator;

  readonly addTablePropButton: Locator;

  readonly addCardFromTableButton: Locator;

  constructor(page: Page) {
    super(page);

    this.selectNewDatabaseAsSource = this.page.locator('data-test=source-new-database');

    this.addTablePropButton = this.page.locator('data-test=add-table-prop');
    this.addCardFromTableButton = this.page.locator('data-test=table-add-card');
  }

  getPropertyTypeOptionLocator(type: PropertyType) {
    return this.page.locator(`data-test=select-property-${type}`);
  }

  getTablePropertyHeaderLocator(type: PropertyType) {
    return this.page.locator(`data-test=table-property-${type}`);
  }

  getTablePropertyValueLocator({ row, propertyType }: { row?: number; propertyType: PropertyType }) {
    return this.page
      .locator(`data-test=database-table-row-${row ?? 0}`)
      .locator(`data-test=property-value-${propertyType}`)
      .first();
  }
}
