import type { Stripe } from '@stripe/stripe-js';
import { loadStripe as _loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string;

let stripePromise: Promise<Stripe | null>;

export function loadStripe() {
  if (!stripePromise) {
    stripePromise = _loadStripe(stripePublicKey);
  }
  return stripePromise;
}
