import env from '@beam-australia/react-env';
import type { Stripe } from '@stripe/stripe-js';
import { loadStripe as _loadStripe } from '@stripe/stripe-js';

// This typecasting prevents stripe throwing an error
// https://stackoverflow.com/a/63784104
const stripePublicKey = env('STRIPE_PUBLIC_KEY') as string;

let stripePromise: Promise<Stripe | null>;

export function loadStripe() {
  if (!stripePromise) {
    stripePromise = _loadStripe(stripePublicKey);
  }
  return stripePromise;
}
