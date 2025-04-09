const express = require('express');
const cors = require('cors');
const { activityRouter } = require('./routes/activity.routes');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/activities', activityRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
