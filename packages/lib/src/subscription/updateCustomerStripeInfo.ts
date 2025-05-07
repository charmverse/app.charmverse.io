import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { stringUtils } from '@charmverse/core/utilities';
import type Stripe from 'stripe';

import { getStripeCustomerBySpaceId } from './getStripeCustomerBySpaceId';
import type { StripeMetadataKeys } from './interfaces';
import { stripeClient } from './stripe';

type UpdateableMetadataKeys = Pick<StripeMetadataKeys, 'domain'>;

type UpdateableCustomerInfo = Pick<Stripe.Customer, 'name' | 'metadata'> & {
  metadata: Partial<UpdateableMetadataKeys>;
};

const validUpdateKeys: (keyof UpdateableCustomerInfo)[] = ['name', 'metadata'];
const validMetadataUpdateKeys: (keyof UpdateableMetadataKeys)[] = ['domain'];

type StripeCustomerUpdate = {
  spaceId: string;
  update: Partial<UpdateableCustomerInfo>;
};

export async function updateCustomerStripeInfo({ update, spaceId }: StripeCustomerUpdate): Promise<Stripe.Customer> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Invalid spaceId ${spaceId}`);
  }
  const customer = await getStripeCustomerBySpaceId({
    spaceId
  });

  if (!customer) {
    throw new DataNotFoundError(`Stripe customer for spaceId ${spaceId} not found`);
  }

  // Prevent passing a null value
  const sanitizedUpdateContent: Partial<UpdateableCustomerInfo> = {};

  for (const key of validUpdateKeys) {
    if (key === 'metadata') {
      sanitizedUpdateContent.metadata = {};

      for (const metaKey of validMetadataUpdateKeys) {
        if (update.metadata?.[metaKey] !== null) {
          (sanitizedUpdateContent.metadata as Record<keyof UpdateableMetadataKeys, any>)[metaKey] =
            update.metadata?.[metaKey];
        }
      }
    } else if (update[key] !== null) {
      sanitizedUpdateContent[key] = update[key];
    }
  }

  const updatedCustomer = await stripeClient.customers.update(customer.id, sanitizedUpdateContent as any);
  return updatedCustomer;
}
