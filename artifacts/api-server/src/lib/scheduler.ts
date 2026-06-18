import cron from "node-cron";
import { logger } from "./logger";

export function initScheduler() {
  cron.schedule("0 2 * * 0", async () => {
    logger.info("Cron Job Triggered: Weekly AI Question Generation");
    try {
        const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/admin/generate-questions`, { method: 'POST' });
        const data = await response.json();
        logger.info(`Cron Job Completed: ${data.message}`);
    } catch (error: any) { // <-- Added ': any'
        logger.error("Cron Job Failed:", error);
    }
  }, { timezone: "Asia/Kolkata" } as any); // <-- Removed 'scheduled: true' and added 'as any'
  
  logger.info("Scheduler initialized. AI Generator cron job set for Sundays at 2:00 AM IST.");
}