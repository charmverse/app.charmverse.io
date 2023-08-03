import type Stripe from 'stripe';
import { v4 } from 'uuid';

type StubProps = {
  status: Extract<Stripe.Subscription.Status, 'active' | 'canceled'>;
  subscriptionId?: string;
  customerId?: string;
  interval?: Extract<Stripe.Plan.Interval, 'month' | 'year'>;
};

export function stripeSubscriptionStub({
  status,
  subscriptionId = `sub_${v4()}`,
  customerId = `cus_${v4()}`,
  interval = 'month'
}: StubProps): Stripe.Subscription & { plan: Stripe.Plan; quantity: number; customer: Stripe.Customer } {
  return {
    id: subscriptionId,
    object: 'subscription',
    application: null,
    application_fee_percent: null,
    automatic_tax: {
      enabled: false
    },
    billing_cycle_anchor: 1688036900,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: {
      comment: null,
      feedback: null,
      reason: null
    },
    collection_method: 'charge_automatically',
    created: 1688036900,
    currency: 'usd',
    current_period_end: 1719659300,
    current_period_start: 1688036900,
    customer: {
      id: customerId,
      object: 'customer',
      address: null,
      balance: 0,
      created: 1687514184,
      currency: 'usd',
      default_source: null,
      delinquent: false,
      description: null,
      discount: null,
      email: 'testuser@charmverse.io',
      invoice_prefix: '6DAD0C38',
      invoice_settings: {
        custom_fields: null,
        default_payment_method: null,
        footer: null,
        rendering_options: null
      },
      livemode: false,
      metadata: {
        domain: 'cvt-dominant-blush-tick',
        spaceId: 'd763059c-2e4e-4c78-8bf2-36a553927309'
      },
      name: 'dominant-blush-tick',
      next_invoice_sequence: 6,
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none',
      test_clock: null
    },
    days_until_due: null,
    default_payment_method: {
      id: 'pm_1NOIiCCoqmaE6diLHQbHZ9vv',
      object: 'payment_method',
      billing_details: {
        address: {
          city: null,
          country: 'EG',
          line1: null,
          line2: null,
          postal_code: null,
          state: null
        },
        email: 'testuser@charmverse.io',
        name: null,
        phone: null
      },
      card: {
        brand: 'visa',
        checks: {
          address_line1_check: null,
          address_postal_code_check: null,
          cvc_check: 'pass'
        },
        country: 'US',
        exp_month: 12,
        exp_year: 2028,
        fingerprint: 'KAEwMpLpDIeooKDk',
        funding: 'credit',
        last4: '4242',
        networks: {
          available: ['visa'],
          preferred: null
        },
        three_d_secure_usage: {
          supported: true
        },
        wallet: null
      },
      created: 1688036912,
      customer: customerId,
      livemode: false,
      metadata: {},
      type: 'card'
    },
    default_source: null,
    default_tax_rates: [],
    description: null,
    discount: null,
    ended_at: null,
    items: {
      object: 'list',
      data: [
        {
          id: 'si_OAe0J2J6AxTbgY',
          object: 'subscription_item',
          billing_thresholds: null,
          created: 1688036901,
          metadata: {},
          plan: {
            id: 'price_1NM5YKCoqmaE6diLrTCWEwCh',
            object: 'plan',
            active: true,
            aggregate_usage: null,
            amount: 1200,
            amount_decimal: '1200',
            billing_scheme: 'per_unit',
            created: 1687509672,
            currency: 'usd',
            interval,
            interval_count: 1,
            livemode: false,
            metadata: {},
            nickname: null,
            product: 'community',
            tiers_mode: null,
            transform_usage: null,
            trial_period_days: null,
            usage_type: 'licensed'
          },
          price: {
            id: 'price_1NM5YKCoqmaE6diLrTCWEwCh',
            object: 'price',
            active: true,
            billing_scheme: 'per_unit',
            created: 1687509672,
            currency: 'usd',
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {},
            nickname: null,
            product: 'community',
            recurring: {
              aggregate_usage: null,
              interval,
              interval_count: 1,
              trial_period_days: null,
              usage_type: 'licensed'
            },
            tax_behavior: 'unspecified',
            tiers_mode: null,
            transform_quantity: null,
            type: 'recurring',
            unit_amount: 1200,
            unit_amount_decimal: '1200'
          },
          quantity: 10,
          subscription: subscriptionId,
          tax_rates: []
        }
      ],
      has_more: false,
      url: `/v1/subscription_items?subscription=${subscriptionId}`
    },
    latest_invoice: 'in_1NOIi0CoqmaE6diLTcvHTQRE',
    livemode: false,
    metadata: {
      loopCheckout: `https://demo.checkout.loopcrypto.xyz/${v4()}/${v4()}?cartEnabled=false&email=testuser@charmverse.io&sub=sub_1NOIi0CoqmaE6diLQMnetM4g`,
      period: 'annual',
      productId: 'community',
      spaceId: 'd763059c-2e4e-4c78-8bf2-36a553927309',
      tier: 'community'
    },
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: 'on_subscription'
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    plan: {
      id: 'price_1NM5YKCoqmaE6diLrTCWEwCh',
      object: 'plan',
      active: true,
      aggregate_usage: null,
      amount: 1200,
      amount_decimal: '1200',
      billing_scheme: 'per_unit',
      created: 1687509672,
      currency: 'usd',
      interval: 'year',
      interval_count: 1,
      livemode: false,
      metadata: {},
      nickname: null,
      product: 'community',
      tiers_mode: null,
      transform_usage: null,
      trial_period_days: null,
      usage_type: 'licensed'
    },
    quantity: 10,
    schedule: null,
    start_date: 1688036900,
    status,
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'create_invoice'
      }
    },
    trial_start: null
  };
}
