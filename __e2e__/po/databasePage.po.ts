import type { Locator, Page } from '@playwright/test';
import { selectors } from '@playwright/test';

import type { PropertyType } from 'lib/focalboard/board';

import { GlobalPage } from './global.po';

type OptionalBoardId = {
  boardId?: string;
};

export class DatabasePage extends GlobalPage {
  /**
   * Used for getting localised board props when multiple boards coexist in the UI
   * @abstract Both browserPage and Locator expose a .locator method
   * */
  private getPageOrBoardLocator({ boardId }: OptionalBoardId) {
    return boardId ? this.getDatabaseContainer({ boardId }) : this.page;
  }

  selectLinkedDatabaseAsSource({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=source-linked-database');
  }

  linkedDatabaseOptions({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=linked-database-option');
  }

  linkedDatabaseSearch({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=linked-database-search').locator('input');
  }

  selectNewDatabaseAsSource({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=source-new-database');
  }

  selectProposalsAsSource({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=source-proposals');
  }

  addTablePropButton({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=add-table-prop');
  }

  addCardFromTableButton({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=table-add-card');
  }

  getDatabaseContainer({ boardId }: { boardId: string }) {
    return this.page.locator(`data-test=database-container-${boardId}`);
  }

  getPropertyTypeOptionLocator({ type, boardId }: { type: PropertyType } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId }).locator(`data-test=select-property-${type}`);
  }

  getTablePropertyHeaderLocator({ type, boardId }: { type: PropertyType } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId }).locator(`data-test=table-property-${type}`);
  }

  getTableRowByCardId({ cardId, boardId }: { cardId: string } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId }).locator(`data-test=database-row-${cardId}`);
  }

  getTableRowByIndex({ index, boardId }: { index: number } & OptionalBoardId) {
    // Todo: Extract this config to a global playwright setup method
    selectors.setTestIdAttribute('data-test');
    return this.getPageOrBoardLocator({ boardId })
      .getByTestId(/^database-row/)
      .nth(index);
  }

  getTablePropertySelectLocator({ cardId, boardId }: { cardId: string } & OptionalBoardId) {
    return {
      closedSelect: this.getPageOrBoardLocator({ boardId })
        .locator(`data-test=database-row-${cardId}`)
        .locator('data-test=select-preview')
        .first(),
      openSelect: this.getPageOrBoardLocator({ boardId })
        .locator(`data-test=database-row-${cardId}`)
        .locator('data-test=autocomplete')
        .first()
    };
  }

  getTablePropertyProposalUrlLocator({ cardId, boardId }: { cardId: string } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId })
      .locator(`data-test=database-row-${cardId}`)
      .locator('data-test=property-proposal-url')
      .locator('a');
  }

  getTablePropertyProposalStatusLocator({ cardId, boardId }: { cardId: string } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId })
      .locator(`data-test=database-row-${cardId}`)
      .locator('data-test=proposal-status-badge');
  }

  getLinkedPageOption({ pageId, boardId }: { pageId: string } & OptionalBoardId) {
    return this.linkedDatabaseOptions({ boardId }).locator(`data-test=linked-database-option-${pageId}`);
  }
}
