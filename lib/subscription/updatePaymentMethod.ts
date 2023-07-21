import { stripeClient } from './stripe';

export type UpdatePaymentMethodRequest = {
  paymentMethodId: string;
};

export async function updatePaymentMethod({
  customerId,
  subscriptionId,
  paymentMethodId
}: UpdatePaymentMethodRequest & {
  customerId: string;
  subscriptionId: string;
}) {
  const setupIntent = await stripeClient.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card']
  });

  await stripeClient.setupIntents.confirm(setupIntent.id, {
    payment_method: paymentMethodId
  });

  await stripeClient.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });

  await stripeClient.subscriptions.update(subscriptionId, {
    default_payment_method: paymentMethodId
  });
}
