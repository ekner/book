const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./db/db.sqlite3");
module.exports.db = db;

module.exports.randomString = function(len)
{
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!#¤%&/()=?@£$€{}[]-_.,;:<>|*";
	var secret = "";
	for (var i = 0; i < len; ++i) {
		var num = Math.floor(Math.random() * chars.length);
		secret += chars[num];
	}
	return secret;
};

module.exports.checkIfIdExistsInLayout = function(id, callbackYes, callbackElse)
{
	if (id === 0) {
		callbackElse(trans("noExistInLayout"));
	} else {
		db.get("SELECT * FROM data WHERE key = 'layout'", function(err, data) {
			if (err) {
				throw(err);
				callbackElse("500");
			} else {
				var layout = JSON.parse(data.value);

				var found = false;
				outerLoop:
				for (var i = 0; i < layout.length; ++i) {
					for (var j = 0; j < layout[i].length; ++j) {
						if (layout[i][j].id === Number(id)) {
							found = true;
							break outerLoop;
						}
					}
				}
				if (found)
					callbackYes();
				else
					callbackElse(trans("noExistInLayout"));
			}
		});
	}
};

module.exports.nameContainsInvalidChars = function(str)
{
	return (
		str.match(/[^ ] [^ ]/) === null ||                // two words (forename + surname)
		str.match(/\t/) !== null ||                       // tab chars
		str.match(/["'@#$%;:&_<>|/!\.\*\\]/) !== null ||  // other invalid chars
		str.match(/[0-9]/) !== null                       // numbers
	)
};

module.exports.send = function(res, data)
{
	if (typeof data === "string") {
		if (data.substr(0, 3) === "500")
			res.status(500).send("Internal Server Error");
		else if (data.substr(0, 3) === "404")
			res.status(404).send(data.substr(3));
		else if (data.substr(0, 3) === "400")
			res.status(400).send(data.substr(3));
		else
			res.send(data);
	}
	else
		res.send(data);
};

module.exports.params = function(req, res, params, callback)
{
	const data = {trans: req.trans, sessionId: req.sessionID};

	for (var i = 0; i < params.length; ++i) {
		if (typeof req.body[params[i]] === "undefined") {
			module.exports.send(res, "400Incorrect/not enough parameters");
			return;
		} else {
			data[params[i]] = req.body[params[i]];
		}
	}

	callback(data);
};

module.exports.errorHappened = function(data)
{
	if (typeof data !== "string") {
		return false;
	} else {
		if (data.substr(0, 3) === "500" || data.substr(0, 3) === "400" || data.substr(0, 3) === "404")
			return true;
		else
			return false;
	}
};
