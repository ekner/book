const fs = require("fs");

dirCheck();

const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const fileStore = require("session-file-store")(session);
const glob = require("./global.js");
const bookSessions = require("./models/book-sessions.js");

const allController = require("./controllers/all.js");
const adminController = require("./controllers/admin.js")

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.text());
app.set("view engine", "ejs");

app.use(session({
	secret: glob.randomString(30),
	rolling: true,
	resave: true,
	saveUninitialized: true,
	store: new fileStore({
		ttl: 1200 // 20 minutes
	}),
	cookie: {
		maxAge: 1200000, // 20 minutes
	}
}));

app.use(require("./lang.js"));

allController.bookSessions(bookSessions);
adminController.bookSessions(bookSessions);

app.use(allController.router);
app.use(adminController.router);

app.get("*", function(req, res) {
	res.status(404).send("404 - Page not found");
});

var server;
getPort(function(port) {
	server = app.listen(port, function() {
		console.log("Server listening on port " + port);
	}).on("error", function(err) {
		abort("Could not start the server on port " + port + ". (Note! Many systems require root access on ports below 1024.)\n\n" + err);
	});
});

function dirCheck()
{
	if (!fs.existsSync("./app.js"))
		abort("app.js is not being run from its own directory! Please first change directory to where the file is stored, and then run app.js.");
}

function getPort(callback)
{
	glob.db.get("SELECT * FROM data WHERE key = 'port'", function(err, data) {
		if (err) {
			throw(err);
			abort();
		} else if (typeof data === "undefined") {
			abort("Could not read listen port from database. Have you run setup.js?");
		} else {
			callback(data.value);
		}
	});
}

function abort(msg)
{
	console.log(msg);
	process.exit(1);
}

process.on('SIGINT', function() {
	process.exit();
});

process.on("exit", function() {
	glob.db.close();
	server.close();
	console.log("\nServer closed.");
});
