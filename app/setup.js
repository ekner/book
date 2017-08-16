const fs = require("fs");

if (!fs.existsSync("./db"))
	fs.mkdirSync("./db");

const readlineSync = require("readline-sync");
const bcrypt = require("bcrypt");
const glob = require("./global.js");

const defaultText = "Welcome to book! This is a sample text. Go to /admin to edit it and to do other admin tasks. <h2>Basic html-support</h2>";
const defaultHeader = "This Is a Header";

function setupDB(callback)
{
	var answer = readlineSync.question("Note! If you have run \"book\" before, all previous data will be deleted. Continue? (y/N) ");
	if (answer !== "y" && answer !== "Y" && answer !== "yes") {
		console.log("Aborted.");
		process.exit(0);
	}

	glob.db.serialize(function() {
		glob.db.run("DROP TABLE IF EXISTS seats");
		glob.db.run("DROP TABLE IF EXISTS data");
		glob.db.run("DROP TABLE IF EXISTS adminAccounts");
		glob.db.run("DROP TABLE IF EXISTS texts");

		glob.db.run("CREATE TABLE data (key TEXT, value TEXT)");
		glob.db.run("CREATE TABLE adminAccounts (username TEXT, password TEXT)");
		glob.db.run("CREATE TABLE seats (id INTEGER, status TEXT, name TEXT, email TEXT, password TEXT, holdTo TEXT)");
		glob.db.run("CREATE TABLE texts (langCode TEXT, text TEXT, header TEXT)");

		glob.db.run("INSERT INTO data VALUES ('layout', ?)", "[]"); // Empty JSON-array
		glob.db.run("INSERT INTO texts VALUES ('default', ?, ?)", [defaultText, defaultHeader]);

		console.log("Database set up.");
		if (typeof callback !== "undefined")
			callback();
	});
}

function fixPort()
{
	ifTableExists("data", function() {
		var port;
		while (isNaN(port) || port < 0 || port > 65535) {
			port = readlineSync.question("Enter the port on which you want the server to listen (leave blank for the default HTTP port 80): ");
			if (port === "")
				port = 80;
		}

		glob.db.serialize(function() {
			glob.db.run("DELETE FROM data WHERE key = 'port'");
			glob.db.run("INSERT INTO data VALUES ('port', ?)", port);
		});

		console.log("Server port saved.");
	});
}

function fixAccounts()
{
	ifTableExists("adminAccounts", function() {
		var adminPass = "";
		while (adminPass === "")
		 	adminPass = readlineSync.question("Enter password for admin: ");
		var bookingPass = readlineSync.question("Enter booking password (leave blank if password shouldn't be required): ");
		var adminPassHash = bcrypt.hashSync(adminPass, 10);
		var bookingPassHash = bcrypt.hashSync(bookingPass, 10);

		glob.db.serialize(function() {
			glob.db.run("DELETE FROM data WHERE key = 'bookPassword'");
			glob.db.run("INSERT INTO data VALUES ('bookPassword', ?)", bookingPassHash);

			glob.db.run("DELETE FROM adminAccounts WHERE username = 'admin'");
			glob.db.run("INSERT INTO adminAccounts VALUES ('admin', ?)", adminPassHash);
		});
		console.log("Password for default admin user and booking password set.");
	});
}

function ifTableExists(name, callback)
{
	glob.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name=?", name, function(err, data) {
		if (err) {
			throw(err);
			process.exit(1);
		} else {
			if (typeof data !== "undefined")
				callback();
			else
				console.log("You must first either run 'node setup.js all' or 'node setup.js db'");
		}
	});
}

function run()
{
	if (typeof process.argv[2] === "undefined") {
		console.log("Run 'node setup.js all' to set up everything. Run 'node setup.js help' to see available flags.");
		return;
	}
	if (process.argv[2] === "help") {
		console.log("Available options:\n  all\n  accounts\n  port\n");
		return;
	}

	switch (process.argv[2]) {
		case "all":
			setupDB();
			fixAccounts();
			fixPort();
			break;
		case "accounts":
			fixAccounts();
			break;
		case "port":
			fixPort();
			break;
	}
}

run();
