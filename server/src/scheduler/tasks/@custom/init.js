'use strict'

// @custom — init
// Register your custom tasks with the scheduler here.
// Called automatically from src/index.js during server startup.
//
// Usage:
//   const { MyTask } = require('.')
//   scheduler.registerTask(new MyTask())

const { TestTask, PostSchedulerTask } = require('.')

/**
 * @param {import('../@system/scheduler')} scheduler
 */
function init(scheduler) {
  // Example task — comment out or replace with real tasks
  scheduler.registerTask(new TestTask())

  // Post scheduling worker — checks every minute for posts due to publish
  scheduler.registerTask(new PostSchedulerTask())
}

module.exports = init
