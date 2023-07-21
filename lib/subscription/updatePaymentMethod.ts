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
  await stripeClient.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId
    }
  });

  await stripeClient.subscriptions.update(subscriptionId, {
    default_payment_method: paymentMethodId
  });
}
