const db = require('../../../lib/@system/PostgreSQL')

const ChatbaseRepo = {
  async findByUserId(userId) {
    return db.oneOrNone(
      'SELECT * FROM chatbase_settings WHERE user_id = $1',
      [userId],
    )
  },

  async upsert(userId, { chatbot_id, api_key, config = {} }) {
    return db.one(
      `INSERT INTO chatbase_settings (user_id, chatbot_id, api_key, config)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         chatbot_id = EXCLUDED.chatbot_id,
         api_key    = EXCLUDED.api_key,
         config     = EXCLUDED.config,
         updated_at = now()
       RETURNING *`,
      [userId, chatbot_id ?? '', api_key ?? '', JSON.stringify(config)],
    )
  },

  async delete(userId) {
    return db.result(
      'DELETE FROM chatbase_settings WHERE user_id = $1',
      [userId],
    )
  },
}

module.exports = ChatbaseRepo
