/**
 * Search Helpers
 * 
 * Reusable utilities for building search queries and handling search patterns
 * Fixed for PostgreSQL parameter syntax ($1, $2, etc.)
 */

/**
 * Build a PostgreSQL full-text search condition
 * 
 * @param {string} query - Search query string
 * @param {Array<string>} columns - Column names to search
 * @param {Object} options - Search options
 * @param {boolean} options.caseSensitive - Use case-sensitive search (default: false)
 * @param {string} options.mode - Search mode: 'contains', 'starts_with', 'exact' (default: 'contains')
 * @param {number} options.paramOffset - Starting parameter index (default: 1)
 * @returns {Object} SQL condition and parameters
 */
function buildSearchCondition(query, columns, options = {}) {
  const {
    caseSensitive = false,
    mode = 'contains',
    paramOffset = 1,
  } = options

  if (!query || !columns || columns.length === 0) {
    return { condition: '', params: [] }
  }

  const searchTerm = caseSensitive ? query : query.toLowerCase()
  let pattern

  switch (mode) {
    case 'starts_with':
      pattern = `${searchTerm}%`
      break
    case 'exact':
      pattern = searchTerm
      break
    case 'contains':
    default:
      pattern = `%${searchTerm}%`
      break
  }

  const operator = mode === 'exact' ? '=' : (caseSensitive ? 'LIKE' : 'ILIKE')
  const conditions = columns.map((col, index) => {
    const paramNum = paramOffset + index
    return caseSensitive ? `${col} ${operator} $${paramNum}` : `LOWER(${col}) ${operator} $${paramNum}`
  })

  return {
    condition: `(${conditions.join(' OR ')})`,
    params: columns.map(() => pattern),
  }
}

/**
 * Parse search query parameters
 * 
 * @param {Object} query - Express req.query object
 * @param {Object} options - Configuration options
 * @param {string} options.queryParam - Name of the search query parameter (default: 'q')
 * @param {string} options.fieldsParam - Name of the fields parameter (default: 'fields')
 * @param {Array<string>} options.defaultFields - Default fields to search if none specified
 * @returns {Object} Parsed search configuration
 */
function parseSearchQuery(query, options = {}) {
  const {
    queryParam = 'q',
    fieldsParam = 'fields',
    defaultFields = [],
  } = options

  const searchQuery = query[queryParam]?.trim() || ''
  
  let fields = defaultFields
  if (query[fieldsParam]) {
    const requestedFields = query[fieldsParam].split(',').map((f) => f.trim()).filter(Boolean)
    if (requestedFields.length > 0) {
      fields = requestedFields
    }
  }

  return {
    query: searchQuery,
    fields,
    isEmpty: !searchQuery,
  }
}

/**
 * Build SQL WHERE clause with search and filters
 * 
 * @param {Object} options - Search and filter options
 * @param {string} options.searchQuery - Search term
 * @param {Array<string>} options.searchFields - Fields to search
 * @param {Object} options.filters - Key-value filter conditions
 * @param {string} options.searchMode - Search mode for buildSearchCondition
 * @returns {Object} SQL WHERE clause and parameters
 */
function buildWhereClause(options = {}) {
  const {
    searchQuery,
    searchFields = [],
    filters = {},
    searchMode = 'contains',
  } = options

  const conditions = []
  const params = []

  // Add search condition
  if (searchQuery && searchFields.length > 0) {
    const searchCondition = buildSearchCondition(searchQuery, searchFields, { 
      mode: searchMode,
      paramOffset: params.length + 1,
    })
    if (searchCondition.condition) {
      conditions.push(searchCondition.condition)
      params.push(...searchCondition.params)
    }
  }

  // Add filter conditions
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Handle IN clause for arrays
        const placeholders = value.map((_, idx) => `$${params.length + idx + 1}`).join(', ')
        conditions.push(`${key} IN (${placeholders})`)
        params.push(...value)
      } else {
        // Handle single value
        params.push(value)
        conditions.push(`${key} = $${params.length}`)
      }
    }
  })

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  return {
    whereClause,
    params,
  }
}

/**
 * Sanitize search query
 * Removes potentially harmful characters and normalizes whitespace
 * 
 * @param {string} query - Raw search query
 * @returns {string} Sanitized query
 */
function sanitizeSearchQuery(query) {
  if (!query) return ''
  
  return query
    .trim()
    .replace(/[;'"\\]/g, '')  // Remove SQL-injection risky chars
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .substring(0, 200)        // Limit length
}

/**
 * Build ORDER BY clause with sorting
 * 
 * @param {Object} options - Sorting options
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort direction: 'asc' or 'desc' (default: 'desc')
 * @param {Array<string>} options.allowedFields - Whitelist of sortable fields
 * @param {string} options.defaultSort - Default sort field
 * @returns {string} SQL ORDER BY clause
 */
function buildOrderByClause(options = {}) {
  const {
    sortBy,
    sortOrder = 'desc',
    allowedFields = [],
    defaultSort = 'created_at',
  } = options

  let field = defaultSort
  if (sortBy && allowedFields.includes(sortBy)) {
    field = sortBy
  }

  const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  return `ORDER BY ${field} ${direction}`
}

module.exports = {
  buildSearchCondition,
  parseSearchQuery,
  buildWhereClause,
  sanitizeSearchQuery,
  buildOrderByClause,
}
