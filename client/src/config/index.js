// Config resolver: merges @system defaults with @custom overrides.
// @system/info.js = template defaults (overwritten during template sync)
// @custom/info.js = product-specific values (NEVER overwritten during sync)
// 
// Usage: import { info } from '@/config'
// Result: { ...systemInfo, ...customInfo } — @custom wins on any overlap

import { info as systemInfo } from './@system/info.js'
import { customInfo } from './@custom/info.js'

export const info = { ...systemInfo, ...customInfo }
