import { loopCheckoutUrl, communityProduct } from '@root/lib/subscription/constants';
import { v4 } from 'uuid';

export const stripeMockIds = {
  subscriptionId: v4(),
  couponId: v4(),
  promoCode: v4(),
  chargeId: v4(),
  clientSecret: v4(),
  customerId: v4(),
  paymentId: v4(),
  priceId: v4(),
  paymentMethodId: v4(),
  invoiceId: v4(),
  setupIntentId: v4()
};

// For standard testing
export const stripeMock = {
  stripeClient: {
    webhooks: {
      constructEvent: jest.fn()
    },
    setupIntents: {
      create: jest.fn().mockResolvedValue({
        id: stripeMockIds.setupIntentId
      }),
      confirm: jest.fn().mockResolvedValue({
        id: stripeMockIds.setupIntentId,
        paymentMethodId: stripeMockIds.paymentMethodId
      })
    },
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        id: stripeMockIds.subscriptionId,
        status: 'incomplete',
        customer: stripeMockIds.customerId,
        items: {
          data: [
            {
              price: {
                id: stripeMockIds.priceId
              },
              quantity: 10
            }
          ]
        }
      }),
      list: jest.fn().mockResolvedValue({
        data: []
      }),
      search: jest.fn().mockResolvedValue({
        data: []
      }),
      create: jest.fn().mockResolvedValue({
        id: stripeMockIds.subscriptionId
      }),
      update: jest.fn(),
      del: jest.fn(),
      cancel: jest.fn()
    },
    paymentIntents: {
      retrieve: jest.fn()
    },
    customers: {
      retrieve: jest.fn().mockResolvedValue({
        id: stripeMockIds.customerId
      }),
      list: jest.fn().mockResolvedValue({
        data: []
      }),
      search: jest.fn().mockResolvedValue({
        data: []
      }),
      create: jest.fn().mockResolvedValue({
        id: stripeMockIds.customerId,
        email: 'test@gmail.com'
      }),
      update: jest.fn(),
      del: jest.fn()
    },
    prices: {
      retrieve: jest
        .fn()
        .mockResolvedValue({ id: stripeMockIds.priceId, recurring: { interval: 'month' }, unit_amount: 120 }),
      list: jest.fn().mockResolvedValue({
        data: [{ id: stripeMockIds.priceId, recurring: { interval: 'month' }, unit_amount: 120 }]
      })
    },
    products: {
      retrieve: jest.fn().mockResolvedValue({
        id: communityProduct.id
      }),
      list: jest.fn().mockResolvedValue({
        data: [{ id: stripeMockIds.priceId, recurring: { interval: 'month' }, unit_amount: 120 }]
      })
    },
    promotionCodes: {
      retrieve: jest.fn().mockResolvedValue({
        id: stripeMockIds.promoCode
      }),
      list: jest.fn().mockResolvedValue({
        data: []
      })
    },
    coupons: {
      retrieve: jest.fn().mockResolvedValue({
        id: stripeMockIds.couponId
      }),
      list: jest.fn().mockResolvedValue({
        data: []
      })
    },
    charges: {
      retrieve: jest.fn().mockResolvedValue({
        id: stripeMockIds.chargeId
      }),
      list: jest.fn().mockResolvedValue({
        data: []
      })
    },
    paymentMethods: {
      list: jest.fn().mockResolvedValue({
        data: []
      }),
      detach: jest.fn()
    }
  }
};

export const loopItemMock = {
  itemId: v4(),
  name: 'Community',
  amount: 1000,
  frequency: 'month',
  frequencyCount: 10,
  entityId: v4(),
  acceptedTokens: { 13: [] },
  externalId: stripeMockIds.priceId,
  createdAt: new Date().getTime(),
  updatedAt: new Date().getTime(),
  active: true,
  url: loopCheckoutUrl
};
