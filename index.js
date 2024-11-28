require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Mongoose Setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const userSchema = new mongoose.Schema({
	username: { type: String, unique: true, required: true },
});
let User = new mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
	username: String,
	description: String,
	duration: Number,
	date: { type: Date, default: new Date().toDateString() },
});
let Exercise = new mongoose.model("Exercise", exerciseSchema);

// CRUD
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
	const user = new User({
		username: req.body.username,
	});
	await user.save();
	const result = await User.findOne({ username: req.body.username });
	res.json({ _id: result._id.toString(), username: result.username });
});

app.get("/api/users", async (req, res) => {
	const result = await User.find({});
	res.json(result);
});
app.post("/api/users/:_id/exercises", async (req, res) => {
	const id = req.params._id;
	const data = req.body;
	const user = await User.findById(id);
	let exercise;

	if (data.date) {
		const date = data.date.split("-");
		const fullDate = new Date(date[0], date[1], date[2]);
		exercise = new Exercise({
			username: user.username,
			description: data.description,
			duration: data.duration,
			date: fullDate,
		});
	} else {
		exercise = new Exercise({
			username: user.username,
			description: data.description,
			duration: data.duration,
		});
	}

	await exercise.save();
	res.json({
		_id: exercise._id,
		username: exercise.username,
		description: exercise.description,
		duration: exercise.duration,
		date: exercise.date.toDateString(),
	});
});

app.get("/api/users/:_id/logs", async (req, res) => {
	const id = req.params._id;
	const start = req.query.from || new Date(0).toISOString();
	const end = req.query.to || new Date(Date.now()).toISOString();
	const limit = Number(req.query.limit) || 0;
	console.log(req.query);

	const user = await User.findById(id);
	const dataExercise = await Exercise.find({ username: user.username, date: { $gte: start, $lt: end } })
		.select("description duration date")
		.limit(limit);

	const log = dataExercise.map((exercise) => ({
		description: exercise.description,
		duration: exercise.duration,
		date: exercise.date.toDateString(),
	}));

	res.json({
		_id: id,
		username: user.username,
		count: log.length,
		log: log,
	});
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log("Your app is listening on port " + listener.address().port);
});
