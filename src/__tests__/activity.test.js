const request = require("supertest");
const app = require("../server");
const { Queue } = require("bullmq");

jest.mock("bullmq");
jest.mock("ioredis");

const mockJob = {
  id: "mock-job-id",
  name: "scheduled-activity",
  data: {
    user_name: "testuser",
    activities: ["Read a book"],
    date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
    status: "completed",
  },
  opts: {
    delay: 0,
    attempts: 3,
  },
  getState: jest.fn().mockResolvedValue("completed"),
  processedOn: Date.now(),
  finishedOn: Date.now(),
  status: "completed",
  state: "completed",
};

const createMockJob = (id, status) => ({
  id,
  name: "scheduled-activity",
  data: {
    user_name: "testuser",
    activities: ["Read a book"],
    date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
    status,
  },
  opts: {
    delay: 0,
    attempts: 3,
  },
  getState: jest.fn().mockResolvedValue(status),
  processedOn: Date.now(),
  finishedOn: Date.now(),
  status: status,
  state: status,
});

describe("Activity API", () => {
  let server;
  let queueInstance;

  beforeEach(() => {
    const jobs = new Map();

    queueInstance = {
      add: jest.fn().mockImplementation((name, data, options) => {
        const job = {
          id: options.jobId,
          name,
          data,
          opts: options,
          getState: jest.fn().mockResolvedValue("waiting"),
          processedOn: null,
          finishedOn: null,
          status: "waiting",
          state: "waiting",
        };
        jobs.set(job.id, job);
        return Promise.resolve(job);
      }),
      getCompleted: jest.fn().mockImplementation(() => {
        const completedJobs = Array.from(jobs.values())
          .filter((job) => job.state === "completed")
          .map((job) => ({
            ...job,
            getState: jest.fn().mockResolvedValue("completed"),
          }));
        return Promise.resolve(completedJobs || []);
      }),
      getFailed: jest.fn().mockImplementation(() => {
        const failedJobs = Array.from(jobs.values())
          .filter((job) => job.state === "failed")
          .map((job) => ({
            ...job,
            getState: jest.fn().mockResolvedValue("failed"),
          }));
        return Promise.resolve(failedJobs || []);
      }),
      getJobs: jest.fn().mockImplementation(() => {
        return Promise.resolve(
          Array.from(jobs.values()).map((job) => ({
            ...job,
            getState: jest.fn().mockResolvedValue(job.state),
          }))
        );
      }),
    };

    // Add a completed job
    const completedJob = {
      id: "completed-job-1",
      name: "scheduled-activity",
      data: {
        user_name: "testuser",
        activities: ["Read a book"],
        date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
        status: "completed",
      },
      opts: { delay: 0, attempts: 3 },
      getState: jest.fn().mockResolvedValue("completed"),
      processedOn: Date.now(),
      finishedOn: Date.now(),
      status: "completed",
      state: "completed",
    };
    jobs.set(completedJob.id, completedJob);

    Queue.mockImplementation(() => queueInstance);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    server = app.listen(3001);
  });

  afterEach((done) => {
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  test("POST /api/activities/schedule - should schedule activities successfully", async () => {
    const mockData = {
      user_name: "testuser",
      activities: ["Read a book", "Go for a walk"],
      date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
    };

    const response = await request(app)
      .post("/api/activities/schedule")
      .send(mockData)
      .expect(200);

    // Validate response structure
    expect(response.body).toHaveProperty(
      "message",
      "Activities scheduled successfully"
    );
    expect(response.body).toHaveProperty("jobId");
    expect(response.body.jobId).toMatch(
      new RegExp(`^${mockData.user_name}-[0-9]+$`)
    );
    expect(response.body.scheduledFor).toEqual(mockData.date);
  });

  test("POST /api/activities/schedule - should validate input data", async () => {
    const invalidData = {
      user_name: "testuser",
      activities: [], // Empty activities array should fail validation
      date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
    };

    const response = await request(app)
      .post("/api/activities/schedule")
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toContain("activities");
  });

  test("GET /api/activities/jobs/:userName - should return user jobs", async () => {
    // First schedule a job
    const mockData = {
      user_name: "testuser",
      activities: ["Read a book"],
      date: new Date("2025-04-09T13:00:00.000Z").toISOString(),
    };

    const scheduleResponse = await request(app)
      .post("/api/activities/schedule")
      .send(mockData)
      .expect(200);

    // Then retrieve the jobs
    const response = await request(app)
      .get("/api/activities/jobs/testuser")
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    // expect(response.body).toHaveLength(1);
    // expect(response.body[0]).toHaveProperty("status", "completed");
  });

  test("GET /api/activities/jobs/:userName/status-count - should return status counts", async () => {
    const response = await request(app)
      .get("/api/activities/jobs/testuser/status-count")
      .expect(200);

    // expect(response.body).toHaveProperty("completed", 1);
    // expect(response.body).toHaveProperty("failed", 0);
  });
});
