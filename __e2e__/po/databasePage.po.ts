import { selectors } from '@playwright/test';

import type { PropertyType } from 'lib/databases/board';
import type { FilterCondition } from 'lib/databases/filterClause';
import { slugify } from 'lib/utils/strings';

import { GlobalPage } from './global.po';

/**
 * Used by a locator method to get a specific board when multiple coexist
 */
type OptionalBoardId = {
  boardId?: string;
};

type OptionalIndex = {
  index?: number;
};

const zeroIndex = 0;

export class DatabasePage extends GlobalPage {
  /**
   * Used for getting localised board props when multiple boards coexist in the UI
   * @abstract Both browserPage and Locator expose a .locator method
   * */
  private getPageOrBoardLocator({ boardId }: OptionalBoardId) {
    return boardId ? this.getDatabaseContainer({ boardId }) : this.page;
  }

  boardTitle({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId }).locator('data-test=board-title').locator('input');
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

  linkedDatabaseOption({ sourceBoardId, boardId }: { sourceBoardId: string } & OptionalBoardId) {
    return this.getPageOrBoardLocator({ boardId }).locator(`data-test=page-option-${sourceBoardId}`);
  }

  selectNewDatabaseAsSource({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId })
      .locator('data-test=create-linked-view') // there are two instances of ViewSourceOptions, expect the one for creating a new linked view
      .locator('data-test=source-new-database');
  }

  selectProposalsAsSource({ boardId }: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator({ boardId })
      .locator('data-test=create-linked-view') // there are two instances of ViewSourceOptions, expect the one for creating a new linked view
      .locator('data-test=source-proposals');
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
      openSelect: this.getPageOrBoardLocator({ boardId }).locator('data-test=active-select-autocomplete').first()
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

  getNewTemplateButton() {
    return this.page.locator('data-test=new-template-button');
  }

  getTemplateMenu({ pageId }: { pageId: string }) {
    return this.page.locator(`data-test=template-menu-${pageId}`);
  }

  getTemplateMenuEditOption({ pageId }: { pageId: string }) {
    return this.page.locator(`data-test=template-menu-edit-${pageId}`);
  }

  getShowOnRelatedBoardButton() {
    return this.page.locator('data-test=show-on-related-board-button');
  }

  getAddRelationButton() {
    return this.page.locator('data-test=add-relation-button');
  }

  getDatabaseTableCell({ templateId, cardId }: { templateId: string; cardId: string }) {
    return this.page.locator(`data-test=database-card-${cardId}-column-${templateId}`);
  }

  getCardDetailsTextInput() {
    return this.page.locator('data-test=card-detail-properties').locator('textarea.octo-propertyvalue').first();
  }

  getTableRowOpenLocator(cardId: string) {
    return this.page.locator(`data-test=database-open-button-${cardId}`).and(this.page.locator('[data-test-resolved]'));
  }

  async waitForBlocksUpdate() {
    await this.page.waitForResponse('**/api/blocks');
  }

  async waitForBlockRelationsUpdate() {
    await this.page.waitForResponse('**/api/blocks/relation/sync-values');
  }

  /**
   * Currently, we only support one filter per board in e2e tests
   */
  openFiltersButton(input: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator(input).locator('data-test=view-filter-button');
  }

  addFilterButton(input: OptionalBoardId = {}) {
    return this.getPageOrBoardLocator(input).locator('data-test=add-filter-button');
  }

  async selectFilterProperty(propertyName: string, input: OptionalBoardId & OptionalIndex = {}) {
    await this.getPageOrBoardLocator(input)
      .locator('data-test=filter-property-button')
      .nth(input.index ?? zeroIndex)
      .click();
    await this.page.locator(`data-test=filter-property-select-${slugify(propertyName)}`).click();
  }

  async selectFilterCondition(condition: FilterCondition, input: OptionalBoardId & OptionalIndex = {}) {
    await this.getPageOrBoardLocator(input)
      .locator('data-test=filter-condition-button')
      .nth(input.index ?? zeroIndex)
      .click();
    await this.page.locator(`data-test=filter-condition-option-${condition}`).click();
  }

  async selectFilterOptionValue(optionId: string, input: OptionalBoardId & OptionalIndex = {}) {
    await this.getPageOrBoardLocator(input)
      .locator('data-test=filter-type-select')
      .nth(input.index ?? zeroIndex)
      .click();
    await this.page.locator(`data-test=filter-option-value-${optionId}`).click();
  }

  async resetDatabaseFilters(input: OptionalBoardId = {}) {
    await this.getPageOrBoardLocator(input).locator('data-test=reset-database-filters').click();
  }

  async closeFilterMenu() {
    await this.page.keyboard.press('Escape');
  }
}
