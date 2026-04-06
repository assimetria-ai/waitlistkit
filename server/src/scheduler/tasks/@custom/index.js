// @custom — export your task classes here
// Then register them in init.js
//
// Example:
//   const MyTask = require('./myTask')
//   module.exports = { MyTask }

const TestTask = require('./TestTask')
const PostSchedulerTask = require('./PostSchedulerTask')

module.exports = { TestTask, PostSchedulerTask }
