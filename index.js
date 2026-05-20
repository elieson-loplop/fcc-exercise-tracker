const express = require("express");
const app = express();
const cors = require("cors");
const User = require("./models/users");
const Exercise = require("./models/exercises");
require("dotenv").config();

const mongoose = require("mongoose");

let connectMongoose = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (e) {
    process.exit(1);
  }
};

connectMongoose();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  try {
    let newUser = new User({ username: req.body.username });
    newUser.save();
    res.json(newUser);
  } catch (e) {
    res.type("text").send(e.stack);
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let data = await User.find();
    res.json(data);
  } catch (e) {
    res.type("text").send(e.stack);
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  try {
    let fromDate = new Date(req.query.from);
    let toDate = new Date(req.query.to);
    let logs;

    let foundUser = await User.findById(req.params.id);
    if (isNaN(fromDate) && isNaN(toDate)) {
      logs = await Exercise.find({
        userid: req.params.id,
      }).limit(req.query.limit);
    } else {
      logs = await Exercise.find({
        userid: req.params.id,
      })
        .where("date")
        .gte(new Date(req.query.from))
        .lte(new Date(req.query.to))
        .limit(req.query.limit);
    }

    let cleanedLogs = logs.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));
    res.json({
      _id: foundUser._id.toString(),
      username: foundUser.username,
      count: logs.length,
      log: cleanedLogs,
    });
  } catch (e) {
    res.type("text").send(e.stack);
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let foundUser = await User.findById(req.params._id);
    let exerciseLog = new Exercise({
      username: foundUser.username,
      description: req.body.description,
      duration: req.body.duration,
      date: req.body.date || new Date().toDateString(),
      userid: foundUser._id.toString(),
    });
    await exerciseLog.save();
    res.json({
      _id: foundUser._id.toString(),
      username: exerciseLog.username,
      date: exerciseLog.date.toDateString(),
      duration: exerciseLog.duration,
      description: exerciseLog.description,
    });
  } catch (e) {
    res.type("text").send(e.stack);
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
