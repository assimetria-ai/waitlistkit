const systemInfo = require('../@system/info')

const customInfo = {
  name: 'WaitlistKit',
  url: process.env.APP_URL ?? 'https://waitlistkit.com',
  description: 'Waitlist management. Your runway starts here.',
}

module.exports = { ...systemInfo, ...customInfo }
