import { stripeClient } from './stripe';

export type CreatePaymentMethodRequest = {
  paymentMethodId: string;
};

export type CreatePaymentMethodResponse = { clientSecret: string } | null;

export async function createPaymentMethod({
  customerId,
  paymentMethodId
}: CreatePaymentMethodRequest & {
  customerId: string;
}): Promise<CreatePaymentMethodResponse> {
  const newSetupIntent = await stripeClient.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card']
  });

  const confirmedSetupIntent = await stripeClient.setupIntents.confirm(newSetupIntent.id, {
    payment_method: paymentMethodId
  });

  return confirmedSetupIntent.status === 'requires_action' && confirmedSetupIntent.client_secret
    ? {
        clientSecret: confirmedSetupIntent.client_secret
      }
    : null;
}
