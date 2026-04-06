/**
 * @custom GraphQL Type Definitions for Taplio Alt
 * Covers: Posts, Analytics, User data
 */

const typeDefs = `#graphql
  scalar DateTime

  # ── User Types ──────────────────────────────────────────────────────────────
  type User {
    id: ID!
    email: String!
    name: String
    role: String!
    avatar_url: String
    bio: String
    is_active: Boolean!
    last_login_at: DateTime
    created_at: DateTime!
    updated_at: DateTime!
  }

  # ── Post Types ──────────────────────────────────────────────────────────────
  enum PostStatus {
    draft
    scheduled
    publishing
    published
    failed
  }

  type Post {
    id: ID!
    user_id: ID!
    content: String!
    status: PostStatus!
    scheduled_for: DateTime
    published_at: DateTime
    linkedin_post_id: String
    published_linkedin_id: String
    schedule_id: String
    retry_count: Int
    max_retries: Int
    last_error: String
    last_attempted_at: DateTime
    created_at: DateTime!
    updated_at: DateTime!
    user: User
  }

  type PostConnection {
    posts: [Post!]!
    total: Int!
    hasMore: Boolean!
  }

  # ── Analytics Types ─────────────────────────────────────────────────────────
  type QueueStats {
    scheduled_count: Int!
    publishing_count: Int!
    published_count: Int!
    retryable_count: Int!
    permanently_failed_count: Int!
    next_scheduled: DateTime
  }

  type PostAnalytics {
    total_posts: Int!
    published_count: Int!
    scheduled_count: Int!
    draft_count: Int!
    failed_count: Int!
    avg_posts_per_week: Float
    publishing_streak: Int
  }

  type DailyPostCount {
    date: String!
    count: Int!
  }

  type StatusBreakdown {
    status: String!
    count: Int!
  }

  # ── Input Types ─────────────────────────────────────────────────────────────
  input PostFilter {
    status: PostStatus
    start: DateTime
    end: DateTime
  }

  input CreatePostInput {
    content: String!
    status: PostStatus
    scheduled_for: DateTime
    schedule_id: String
  }

  input UpdatePostInput {
    content: String
    status: PostStatus
    scheduled_for: DateTime
    schedule_id: String
  }

  input PaginationInput {
    limit: Int
    offset: Int
  }

  # ── Queries ─────────────────────────────────────────────────────────────────
  type Query {
    # Current authenticated user
    me: User

    # Posts
    posts(filter: PostFilter, pagination: PaginationInput): PostConnection!
    post(id: ID!): Post
    queueStats: QueueStats!

    # Analytics
    postAnalytics: PostAnalytics!
    dailyPostCounts(days: Int): [DailyPostCount!]!
    statusBreakdown: [StatusBreakdown!]!
  }

  # ── Mutations ───────────────────────────────────────────────────────────────
  type Mutation {
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): Post!
    retryPost(id: ID!): Post!
    reschedulePost(id: ID!, scheduled_for: DateTime!): Post!
  }

  # ── Subscriptions ──────────────────────────────────────────────────────────
  type Subscription {
    postStatusChanged(userId: ID): Post!
    queueStatsUpdated: QueueStats!
  }
`

module.exports = typeDefs
