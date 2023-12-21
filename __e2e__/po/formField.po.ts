import type { Page } from '@playwright/test';

import { DocumentPage } from './document.po';

export class FormField extends DocumentPage {
  constructor(
    page: Page,
    public addNewFormFieldButton = page.locator('data-test=add-new-form-field-button'),
    public formFieldNameInput = page.locator('data-test=form-field-name-input'),
    public formFieldRequiredSwitch = page.locator('data-test=form-field-required-switch'),
    public toggleFormFieldButton = page.locator('data-test=toggle-form-field-button'),
    public formFieldsSaveButton = page.locator('data-test=form-fields-save-button'),
    public formFieldsAnswersSaveButton = page.locator('data-test=form-fields-answers-save-button')
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
