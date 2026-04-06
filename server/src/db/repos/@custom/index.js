// @custom repositories — product-specific database repositories
// Add your custom repos here and export them.
// This file is NEVER overwritten during template sync.
//
// Example:
// const ProjectRepo = require('./ProjectRepo')
// module.exports = { ProjectRepo }

const ApiKeyRepo = require('./ApiKeyRepo')
const AuditLogRepo = require('./AuditLogRepo')
const BrandRepo = require('./BrandRepo')
const CollaboratorRepo = require('./CollaboratorRepo')
const BlogPostRepo = require('./BlogPostRepo')
const UserRepo = require('./UserRepo')
const TeamRepo = require('./TeamRepo')
const PermissionRepo = require('./PermissionRepo')
const EmailLogRepo = require('./EmailLogRepo')
const FileUploadRepo = require('./FileUploadRepo')
const LinkedInAccountRepo = require('./LinkedInAccountRepo')

module.exports = { 
  ApiKeyRepo, 
  AuditLogRepo, 
  BlogPostRepo, 
  BrandRepo, 
  CollaboratorRepo, 
  UserRepo,
  TeamRepo,
  PermissionRepo,
  EmailLogRepo,
  FileUploadRepo,
  LinkedInAccountRepo
}
