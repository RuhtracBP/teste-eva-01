const { Worker } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost'
});

const worker = new Worker('activity-queue', async (job) => {
  const { activities, user_name, date } = job.data;
  const scheduledTime = new Date(date).getTime();
  const currentTime = Date.now();

  // Double-check if it's time to process
  if (currentTime < scheduledTime) {
    await job.updateProgress(0);
    throw new Error('Not time yet');
  }

  // Update progress to show it's starting
  await job.updateProgress(50);

  console.log(`Processing activities for ${user_name} scheduled for ${date}:`);
  activities.forEach((activity, index) => {
    console.log(`${index + 1}. ${activity}`);
  });

  // Update progress to show it's complete
  await job.updateProgress(100);

  // Return the processed activities for record
  return {
    processedAt: new Date().toISOString(),
    activities: activities.length
  };
}, {
  connection,
  autorun: true,
  concurrency: 10,
  removeOnComplete: false,
  removeOnFail: false
});

worker.on('completed', job => {
  console.log(`Job ${job.id} has been completed with result:`, job.returnvalue);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} has failed with error ${err.message}`);
});

worker.on('progress', (job, progress) => {
  console.log(`Job ${job.id} is ${progress}% complete`);
});
