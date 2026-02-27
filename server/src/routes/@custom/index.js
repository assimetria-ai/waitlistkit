const express = require('express')
const router = express.Router()

router.use(require('../../api/@custom/errors'))
router.use(require('../../api/@custom/waitlist'))
router.use(require('../../api/@custom/search'))

module.exports = router
