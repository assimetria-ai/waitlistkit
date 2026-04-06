// @custom — product-specific server config override
// Merge/override values from @system/info.js here.
// This file is NEVER overwritten during template sync.

const systemInfo = require('../@system/info')

const customInfo = {
  // Override @system values here, e.g.:
  // name: 'MyProduct',
  // url: 'https://myproduct.com',
}

module.exports = { ...systemInfo, ...customInfo }
