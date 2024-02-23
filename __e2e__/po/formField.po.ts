import type { FormFieldType } from '@charmverse/core/prisma';
import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class FormField extends DocumentPage {
  constructor(
    page: Page,
    public addNewFormFieldButton = page.locator('data-test=add-new-form-field-button'),
    public formFieldNameInput = page.locator('data-test=form-field-name-input'),
    public formFieldRequiredSwitch = page.locator('data-test=form-field-required-switch'),
    public formFieldPrivateSwitch = page.locator('data-test=form-field-private-switch'),
    public toggleFormFieldButton = page.locator('data-test=toggle-form-field-button'),
    public fieldType = page.locator('data-test=form-field-type-select'),
    public fieldMoreOptions = page.locator('data-test=form-field-more-options-popup'),
    public deleteField = page.locator('data-test=delete-form-field')
  ) {
    super(page);
  }

  getFormFieldNameInput(index: number = 0) {
    return this.formFieldNameInput.getByPlaceholder('Title (required)').nth(index);
  }

  getFormFieldInput(fieldId: string, fieldType: FormFieldType) {
    const baseLocator = this.page.locator(`data-test=form-field-input-${fieldId}`);

    switch (fieldType) {
      case 'wallet':
      case 'email':
      case 'url':
      case 'phone':
      case 'short_text':
        return baseLocator.locator('textarea').first();
      case 'date':
      case 'number':
      default:
        return baseLocator.locator('input').first();
    }
  }

  async selectFormFieldType({ index, fieldType }: { index: number; fieldType: FormFieldType }) {
    await this.fieldType.nth(index).click();
    await this.page.locator(`data-test=form-field-type-option-${fieldType}`).click();
  }
}
