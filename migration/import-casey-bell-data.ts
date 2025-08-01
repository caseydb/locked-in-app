import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface CompletionHistoryEntry {
  displayName: string;
  duration: string;
  task: string;
  timestamp: number;
  userId: string;
}

interface TaskEntry {
  completed: boolean;
  order: number;
  text: string;
}

interface CaseyBellData {
  users: {
    [key: string]: {
      "task table ids": {
        user_id: string;
        room_id: string;
      };
      completionHistory?: {
        [key: string]: CompletionHistoryEntry;
      };
      tasks?: {
        [key: string]: TaskEntry;
      };
    };
  };
}

// Function to parse duration string (mm:ss or hh:mm:ss) to seconds
function parseDurationToSeconds(durationStr: string): number {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) {
    // mm:ss format
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // hh:mm:ss format
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

// Function to convert timestamp to Pacific/Auckland timezone
function convertToAucklandTime(timestamp: number): Date {
  // Create a date from the timestamp
  const date = new Date(timestamp);
  
  // Format to Auckland timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const dateParts: { [key: string]: string } = {};
  
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  // Construct ISO string in Auckland time
  const isoString = `${dateParts.year}-${dateParts.month}-${dateParts.day}T${dateParts.hour}:${dateParts.minute}:${dateParts.second}.${dateParts.fractionalSecond || '000'}Z`;
  
  return new Date(isoString);
}

async function importCaseyBellData() {
  try {
    // Read the casey-bell.json file
    const dataPath = path.join(__dirname, 'casey-bell.json');
    const caseyBellData: CaseyBellData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    let completedTasksImported = 0;
    let notStartedTasksImported = 0;
    
    // Process each user's data
    for (const [firebaseUserId, userData] of Object.entries(caseyBellData.users)) {
      const userId = userData["task table ids"].user_id;
      const roomId = userData["task table ids"].room_id;
      
      
      // Import completion history (completed tasks)
      if (userData.completionHistory) {
        
        for (const [historyId, entry] of Object.entries(userData.completionHistory)) {
          try {
            const durationSeconds = parseDurationToSeconds(entry.duration);
            const completedAt = convertToAucklandTime(entry.timestamp);
            
            await prisma.task.create({
              data: {
                user_id: userId,
                room_id: roomId,
                task_name: entry.task,
                status: 'completed',
                duration: durationSeconds,
                completed_at: completedAt,
                created_at: completedAt,
                updated_at: completedAt,
                timezone: 'Pacific/Auckland'
              }
            });
            
            completedTasksImported++;
            
          } catch (error) {
            console.error(`✗ Error importing completion history ${historyId}:`, error);
          }
        }
      }
      
      // Import tasks (not started)
      if (userData.tasks) {
        
        const nowAuckland = new Date();
        
        for (const [taskId, task] of Object.entries(userData.tasks)) {
          try {
            // Skip completed tasks in the tasks list
            if (task.completed) {
              continue;
            }
            
            await prisma.task.create({
              data: {
                user_id: userId,
                room_id: roomId,
                task_name: task.text,
                status: 'not_started',
                duration: 0,
                completed_at: null, // NULL for not started tasks
                created_at: nowAuckland,
                updated_at: nowAuckland,
                timezone: 'Pacific/Auckland'
              }
            });
            
            notStartedTasksImported++;
            
          } catch (error) {
            console.error(`✗ Error importing task ${taskId}:`, error);
          }
        }
      }
    }
    
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importCaseyBellData().catch(console.error);