const express = require('express')
const router = express.Router()

// @custom — register your product-specific routers here
router.use(require('../../api/@custom/audit-logs'))
router.use(require('../../api/@custom/errors'))
// router.use(require('../../api/@custom/search')) — removed: conflicts with @system/search
router.use(require('../../api/@custom/collaborators'))
// router.use(require('../../api/@custom/brands')) — moved to @system (migration 012)
router.use(require('../../api/@custom/chatbase'))
router.use(require('../../api/@custom/email-logs'))
// router.use(require('../../api/@custom/storage')) — removed: conflicts with @system/storage
router.use(require('../../api/@custom/blog'))
router.use(require('../../api/@custom/pages'))
router.use(require('../../api/@custom/pricing'))
router.use(require('../../api/@custom/clips'))
router.use(require('../../api/@custom/teams'))
router.use(require('../../api/@custom/posts'))
router.use(require('../../api/@custom/linkedin-oauth'))
router.use(require('../../api/@custom/hashtags'))
router.use(require('../../api/@custom/analytics'))
router.use(require('../../api/@custom/file-sharing'))

module.exports = router
