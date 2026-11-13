import { expireStale } from "./services/bookings.js";

/**
 * Background housekeeping: lapsed holds and unanswered requests expire, finished stays are marked
 * completed. Runs in the API process; on a single server that's all it needs.
 */
export function startJobs() {
  const run = async () => {
    try {
      const r = await expireStale();
      if (r.expired || r.completed) console.info(`[jobs] expired ${r.expired}, completed ${r.completed}`);
    } catch (err) {
      console.warn("[jobs] housekeeping failed:", (err as Error).message);
    }
  };
  void run();
  return setInterval(run, 60_000);
}
