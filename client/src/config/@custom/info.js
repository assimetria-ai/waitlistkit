// @custom — product-specific config override
// Override any values from @system/info.js here.
// This file is NEVER overwritten during template sync.

export const customInfo = {
  name: 'Splice',
  tagline: 'Ship faster, together.',
  url: import.meta.env.VITE_APP_URL ?? 'https://splice.so',
  supportEmail: 'support@splice.com',
}
