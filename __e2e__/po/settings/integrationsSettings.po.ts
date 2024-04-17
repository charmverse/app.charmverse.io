import type { Locator, Page } from '@playwright/test';

import { SettingsModal } from './settings.po';

export class IntegrationsSettings extends SettingsModal {
  readonly saveButton: Locator;

  readonly enableSynaps: Locator;

  readonly enablePersona: Locator;

  readonly synapsApiKey: Locator;

  readonly synapsSecret: Locator;

  readonly synapsKycButton: Locator;

  readonly modalCancelButton: Locator;

  readonly personaApiKey: Locator;

  readonly personaSecret: Locator;

  readonly personaTemplateId: Locator;

  readonly personaEnvironmentId: Locator;

  readonly personaKycButton: Locator;

  constructor(page: Page) {
    super(page);
    this.enableSynaps = page.getByLabel('Enable Synaps.io KYC');
    this.enablePersona = page.getByLabel('Enable Persona KYC');
    this.saveButton = page.locator('data-test=save-kyc-form');
    this.synapsApiKey = page.locator('input[name=synapsApiKey]');
    this.synapsSecret = page.locator('input[name=synapsSecret]');
    this.synapsKycButton = page.locator('data-test=start-synaps-kyc');
    this.modalCancelButton = page.locator('data-test=modal-cancel-button');
    this.personaApiKey = page.locator('input[name=personaApiKey]');
    this.personaSecret = page.locator('input[name=personaSecret]');
    this.personaTemplateId = page.locator('input[name=personaTemplateId]');
    this.personaEnvironmentId = page.locator('input[name=personaEnvironmentId]');
    this.personaKycButton = page.locator('data-test=start-persona-kyc');
  }
}
