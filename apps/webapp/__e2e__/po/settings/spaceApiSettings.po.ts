// playwright-dev-page.ts
import type { Locator, Page } from '@playwright/test';

import { WebhookNameSpaces } from '@packages/lib/webhookPublisher/interfaces';

import { SettingsModal } from './settings.po';

// capture actions on the pages in signup flow
export class ApiSettings extends SettingsModal {
  readonly webhookUrlInput: Locator;

  readonly webhookSigningSecret: Locator;

  readonly namespaceSwitches: Record<WebhookNameSpaces, Locator>;

  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.webhookUrlInput = page.locator('data-test=webhook-url-input >> input');
    this.webhookSigningSecret = page.locator('data-test=webhook-signing-secret >> input');
    this.namespaceSwitches = Object.values(WebhookNameSpaces).reduce(
      (inputs, namespace) => {
        inputs[namespace] = page.locator(`data-test=enable-${namespace}-switch >> input`);
        return inputs;
      },
      {} as Record<WebhookNameSpaces, Locator>
    );
    this.saveButton = page.locator('data-test=submit');
  }

  async forEachNamespace(callback: (toggle: Locator, namespace: WebhookNameSpaces) => Promise<void>) {
    const namespaces = Object.values(WebhookNameSpaces);
    for (let i = 0; i < namespaces.length; i++) {
      const namespace = namespaces[i];
      await callback(this.namespaceSwitches[namespace], namespace);
    }
  }
}
