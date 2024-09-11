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
    public deleteField = page.locator('data-test=delete-form-field'),
    public formFieldAnswerComment = page.locator('data-test=form-field-answer-comment')
  ) {
    super(page);
  }

  getFormFieldNameInput(index: number = 0) {
    return this.formFieldNameInput.getByPlaceholder('Title (required)').nth(index);
  }

  async fillProjectField({
    content,
    fieldName,
    textArea = false
  }: {
    textArea?: boolean;
    fieldName: string;
    content: string;
  }) {
    const pendingApiCall = this.page.waitForResponse((response) => {
      return response.request().method() === 'PUT' && /\/api\/projects/.test(response.url());
    });
    const inputLocator = this.page.locator(`data-test=project-field-${fieldName} >> input`).first();
    const textareaLocator = this.page.locator(`data-test=project-field-${fieldName} >> textarea`).first();
    const result = await inputLocator.or(textareaLocator).fill(content);

    await pendingApiCall;
    return result;
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

  async toggleProjectFieldConfig({
    fieldName,
    show,
    required,
    private: _private
  }: {
    fieldName: string;
    required?: boolean;
    show?: boolean;
    private?: boolean;
  }) {
    // By default, the field is required
    if (!required) {
      await this.page.locator(`data-test=${fieldName}-field-required-toggle`).first().click();
    }

    // By default, the field is not hidden
    if (show === false) {
      await this.page.locator(`data-test=${fieldName}-field-show-toggle`).first().click();
    }

    if (_private !== undefined) {
      await this.page.locator(`data-test=${fieldName}-field-private-toggle`).first().click();
    }
  }

  getProjectFieldLabel(fieldName: string) {
    return this.page.locator(`data-test=project-${fieldName}-field-container >> data-test=field-label`);
  }

  async getProjectOption(projectId: string) {
    await this.page.locator('data-test=project-profile-select').click();
    return this.page.locator(`data-test=project-option-${projectId}`);
  }

  async clickProjectOption(projectId: string) {
    await this.page.locator('data-test=project-profile-select').click();
    await this.page.locator(`data-test=project-option-${projectId}`).click();
  }
}
