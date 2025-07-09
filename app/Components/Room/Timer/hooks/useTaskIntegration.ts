import { useCallback } from "react";
import { rtdb } from "../../../../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

export function useTaskIntegration(userId: string | undefined) {
  // Helper to move task to position #1 in task list (add if doesn't exist, move if exists)
  const moveTaskToTop = useCallback(
    async (taskText: string): Promise<void> => {
      if (!userId) return;

      const tasksRef = ref(rtdb, `users/${userId}/tasks`);

      return new Promise((resolve) => {
        // Get current tasks and move/add the task to position #1
        onValue(
          tasksRef,
          (snapshot) => {
            const tasksData = snapshot.val();
            const updates: Record<string, { text: string; completed: boolean; order: number }> = {};

            // Find if task already exists
            let existingTaskId: string | null = null;
            if (tasksData) {
              existingTaskId =
                Object.keys(tasksData).find((taskId) => {
                  const task = tasksData[taskId];
                  return task.text === taskText && !task.completed;
                }) || null;
            }

            // Increment order of all other tasks
            if (tasksData) {
              Object.keys(tasksData).forEach((taskId) => {
                if (taskId !== existingTaskId) {
                  const existingTask = tasksData[taskId];
                  updates[taskId] = {
                    text: existingTask.text,
                    completed: existingTask.completed,
                    order: (existingTask.order || 0) + 1,
                  };
                }
              });
            }

            // Add/move the target task to position 0
            const targetTaskId = existingTaskId || Date.now().toString();
            updates[targetTaskId] = {
              text: taskText,
              completed: false,
              order: 0,
            };

            // Update all tasks at once and resolve promise
            set(tasksRef, updates).then(() => resolve());
          },
          { onlyOnce: true }
        );
      });
    },
    [userId]
  );

  // Helper to mark matching task as completed in task list
  const completeTaskInList = useCallback(
    async (taskText: string) => {
      if (!userId || !taskText.trim()) return;

      const tasksRef = ref(rtdb, `users/${userId}/tasks`);

      // Find and complete the matching task
      onValue(
        tasksRef,
        (snapshot) => {
          const tasksData = snapshot.val();
          if (tasksData) {
            // Find the first incomplete task that matches the text
            const matchingTaskId = Object.keys(tasksData).find((taskId) => {
              const taskItem = tasksData[taskId];
              return taskItem.text === taskText && !taskItem.completed;
            });

            if (matchingTaskId) {
              const taskRef = ref(rtdb, `users/${userId}/tasks/${matchingTaskId}`);
              const matchingTask = tasksData[matchingTaskId];
              set(taskRef, {
                ...matchingTask,
                completed: true,
              });
            }
          }
        },
        { onlyOnce: true }
      );
    },
    [userId]
  );

  return {
    moveTaskToTop,
    completeTaskInList,
  };
}