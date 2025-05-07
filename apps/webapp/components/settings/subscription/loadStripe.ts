import env from '@beam-australia/react-env';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe as _loadStripe } from '@stripe/stripe-js';

const stripePublicKey = env('STRIPE_PUBLIC_KEY');

let stripePromise: Promise<Stripe | null>;

export function loadStripe() {
  if (!stripePromise) {
    if (stripePublicKey) {
      stripePromise = _loadStripe(stripePublicKey);
    } else {
      stripePromise = Promise.resolve(null);
    }
  }
  return stripePromise;
}
