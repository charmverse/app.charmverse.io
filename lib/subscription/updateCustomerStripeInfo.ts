import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { stringUtils } from '@charmverse/core/utilities';
import type Stripe from 'stripe';

import { getStripeCustomerBySpaceId } from './getStripeCustomerBySpaceId';
import { stripeClient } from './stripe';

type UpdateableCustomerInfo = Pick<Stripe.Customer, 'name'>;

const validUpdateKeys: (keyof UpdateableCustomerInfo)[] = ['name'];

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
    if (update[key] !== null) {
      sanitizedUpdateContent[key] = update[key];
    }
  }

  const updatedCustomer = await stripeClient.customers.update(customer.id, sanitizedUpdateContent as any);

  // await fs.writeFile(`${path.resolve(`jsonoutputs/${spaceId}-${Date.now()}`)}`, JSON.stringify(customer, null, 2));

  return updatedCustomer;
}
