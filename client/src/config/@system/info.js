// @system — product identity config
// Override these values per product in config/@custom/info.ts
export const info = {
  name: 'ProductTemplate',
  tagline: 'Your product tagline here',
  url: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
  supportEmail: 'support@example.com' }
