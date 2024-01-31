import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class FormField extends DocumentPage {
  constructor(
    page: Page,
    public addNewFormFieldButton = page.locator('data-test=add-new-form-field-button'),
    public formFieldNameInput = page.locator('data-test=form-field-name-input'),
    public formFieldRequiredSwitch = page.locator('data-test=form-field-required-switch'),
    public formFieldPrivateSwitch = page.locator('data-test=form-field-private-switch'),
    public toggleFormFieldButton = page.locator('data-test=toggle-form-field-button')
  ) {
    super(page);
  }

  getFormFieldNameInput(index: number = 0) {
    return this.formFieldNameInput.getByPlaceholder('Title (required)').nth(index);
  }

  getFormFieldInput(fieldId: string) {
    return this.page.locator(`data-test=form-field-input-${fieldId} >> input`);
  }
}
