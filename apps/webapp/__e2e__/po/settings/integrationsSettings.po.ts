import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

export class IntegrationsSettings extends SettingsModal {
  constructor(
    page: Page,
    public container = page.locator('data-test=integration-KYC'),
    public connectButton = container.locator('data-test=connect-button'),
    public kycOption = page.locator('input[name=kycOption]'),
    public saveButton = page.locator('data-test=save-kyc-form'),
    public synapsApiKey = page.locator('input[name=synapsApiKey]'),
    public synapsSecret = page.locator('input[name=synapsSecret]'),
    public synapsKycButton = page.locator('data-test=start-synaps-kyc'),
    public modalCancelButton = page.locator('data-test=modal-cancel-button'),
    public personaApiKey = page.locator('input[name=personaApiKey]'),
    public personaSecret = page.locator('input[name=personaSecret]'),
    public personaTemplateId = page.locator('input[name=personaTemplateId]'),
    public personaKycButton = page.locator('data-test=start-persona-kyc')
  ) {
    super(page);
  }
}
