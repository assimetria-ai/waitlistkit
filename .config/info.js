// Central product config — shared source of truth for both client and server
// @system — do not modify this file directly; override values in config/@custom/

let GENERAL_INFO = {
  name: 'ProductTemplate',
  description: 'New SaaS Product built on the Assimetria template',
  cta: {
    title: 'Start Today',
    description: 'Join thousands of users transforming their workflow.',
    buttonText: 'Get Started for Free',
  },
  url: 'https://yourproduct.com',
  email: 'general@yourproduct.com',
  supportEmail: 'support@yourproduct.com',
  socials: [],
  theme_color: '#6940f8',
  background_color: '#f7f6fe',
  links: {
    faq: 'https://support.yourproduct.com',
    refer_and_earn: 'https://yourproduct.com/refer-and-earn',
  },
  products: {
    monthly: {
      price: 49,
      description: 'Monthly Subscription',
    },
    yearly: {
      price: 397,
      description: 'Yearly Subscription',
    },
  },
  plans: [
    {
      priceId: 'price_REPLACE_ME',
      price: 49,
      yearlyPrice: 397,
      name: 'Pro',
      description: 'Pro Plan',
      paymentLink: '',
      noAllowedRoutes: [],
    },
  ],
  authMode: 'web2', // Options: 'web2' (email/password) or 'web3' (wallet)
}

module.exports = GENERAL_INFO
