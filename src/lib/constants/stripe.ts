export const STRIPE_PRICES = {
  monthly: 'price_1T6ZiFLRKGH1pF114Qki8vXL',
  annual: 'price_1T6ZipLRKGH1pF11y6Fq6onu',
  foundingMonthly: 'price_1T6ZjMLRKGH1pF11gTMrTSPD',
  foundingAnnual: 'price_1T6ZjwLRKGH1pF11cAJEf8Hw',
} as const

// Token pack prices (one-time payments) -- create these in Stripe Dashboard
// then paste the price IDs here
export const TOKEN_PACK_PRICES = {
  small:  { priceId: 'price_1TEjJCLRKGH1pF11Z4BfQBGk', label: '10 cm', tokens: 10, price: '$2.99' },
  medium: { priceId: 'price_1TEjLlLRKGH1pF11jMp01rPy', label: '25 cm', tokens: 25, price: '$5.99' },
  large:  { priceId: 'price_1TEjJDLRKGH1pF11xR6n7BYI', label: '50 cm', tokens: 50, price: '$9.99' },
} as const

export const WEEKLY_SUBSCRIBER_REFILL = 10

export const FOUNDING_MEMBER_LIMIT = 500

// Founding rate is available until we hit 500 subscribers.
// Check subscriptions table: SELECT COUNT(*) WHERE is_founding_member = true
