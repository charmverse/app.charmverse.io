import type { Locator, Page } from '@playwright/test';
import { selectors } from '@playwright/test';

import type { PropertyType } from 'lib/focalboard/board';

import { GlobalPage } from './global.po';

export class DatabasePage extends GlobalPage {
  readonly selectNewDatabaseAsSource: Locator;

  readonly selectProposalsAsSource: Locator;

  readonly addTablePropButton: Locator;

  readonly addCardFromTableButton: Locator;

  constructor(page: Page) {
    super(page);

    this.selectNewDatabaseAsSource = this.page.locator('data-test=source-new-database');
    this.selectProposalsAsSource = this.page.locator('data-test=source-proposals');

    this.addTablePropButton = this.page.locator('data-test=add-table-prop');
    this.addCardFromTableButton = this.page.locator('data-test=table-add-card');
  }

  getPropertyTypeOptionLocator(type: PropertyType) {
    return this.page.locator(`data-test=select-property-${type}`);
  }

  getTablePropertyHeaderLocator(type: PropertyType) {
    return this.page.locator(`data-test=table-property-${type}`);
  }

  getTableRowByCardId({ cardId }: { cardId: string }) {
    return this.page.locator(`data-test=database-row-${cardId}`);
  }

  getTableRowByIndex({ index }: { index: number }) {
    // Todo: Extract this config to a global playwright setup method
    selectors.setTestIdAttribute('data-test');
    return this.page.getByTestId(/^database-row/).nth(index);
  }
}
