const express = require("express");
const Joi = require("joi");
const { Queue } = require("bullmq");
const Redis = require("ioredis");
const { parseISO, formatISO, addHours } = require("date-fns");

const router = express.Router();
const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
});

const activityQueue = new Queue("activity-queue", {
  connection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
    attempts: 3,
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 1,
    lockDuration: 30000,
    lockRenewTime: 15000,
  },
});

const activitySchema = Joi.object({
  activities: Joi.array().items(Joi.string()).required(),
  date: Joi.string().required(),
  user_name: Joi.string().required(),
});

router.post("/schedule", async (req, res) => {
  try {
    const { error, value } = activitySchema.validate(req.body);

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { activities, date, user_name } = value;

    const scheduledDate = parseISO(date);
    const jobId = `${user_name}-${Date.now()}`;

    // Calculate delay in milliseconds, adding 3 hours to account for UTC-3
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const delay = scheduledDate - Number(new Date()) + threeHoursInMs;
    console.log("Delay in ms:", delay);

    const job = await activityQueue.add(
      "scheduled-activity",
      {
        activities,
        date: formatISO(scheduledDate),
        user_name,
        status: "waiting",
      },
      {
        jobId,
        delay,
      }
    );

    res.json({
      message: "Activities scheduled successfully",
      jobId: job.id,
      scheduledFor: scheduledDate,
    });
  } catch (err) {
    console.error("Scheduling error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:userName", async (req, res) => {
  try {
    const completedJobs = await activityQueue.getCompleted();
    const failedJobs = await activityQueue.getFailed();

    const allJobs = [...completedJobs, ...failedJobs];

    const userJobs = await Promise.all(
      allJobs
        .filter((job) => job.data.user_name === req.params.userName)
        .map(async (job) => {
          const state = await job.getState();
          return {
            id: job.id,
            status: state,
            data: job.data,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn,
            scheduledFor: job.data.date,
          };
        })
    );

    res.json(userJobs);
  } catch (err) {
    console.error("Error fetching jobs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:userName/status-count", async (req, res) => {
  try {
    const completedJobs = await activityQueue.getCompleted();
    const failedJobs = await activityQueue.getFailed();

    const userJobs = [...completedJobs, ...failedJobs].filter(
      (job) => job.data.user_name === req.params.userName
    );

    const statusCount = {
      completed: userJobs.filter((job) => job.status === "completed").length,
      failed: userJobs.filter((job) => job.status === "failed").length,
    };

    res.json(statusCount);
  } catch (err) {
    console.error("Error counting job statuses:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = { activityRouter: router };
