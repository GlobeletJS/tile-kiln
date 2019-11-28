import "./bg-tasks.js";

export function setupQueue() {
  // https://developer.mozilla.org/en-US/docs/Web/API/Background_Tasks_API

  const taskList = [];
  let taskHandle = null;

  return {
    enqueueTask,
    length: () => taskList.length,
  };

  function enqueueTask(taskHandler, taskData) {
    taskList.push({
      handler: taskHandler,
      data: taskData,
    });

    if (!taskHandle) {
      taskHandle = requestIdleCallback(runTaskQueue, { timeout: 1000 });
    }
  }

  function runTaskQueue(deadline) {
    while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && taskList.length) {
      let task = taskList.shift();
      task.handler(task.data);
    }

    if (taskList.length) {
      // Ran out of time in this frame. Request more time in the next idle frame
      taskHandle = requestIdleCallback(runTaskQueue, { timeout: 1000 });
    } else {
      // Make sure enqueueTask knows that we don't have a queue running
      taskHandle = 0;
    }
  }
}
