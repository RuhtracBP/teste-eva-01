const express = require("express");
const cors = require("cors");
const { activityRouter } = require("./routes/activity.routes");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/activities", activityRouter);

// Only start the server if this file is run directly (not in tests)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;
