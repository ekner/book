const bcrypt = require("bcrypt");
const glob = require("../global.js");

var bookSessions;

module.exports.bookSessions = function(_bookSessions)
{
	bookSessions = _bookSessions;
};

module.exports.getInfoTextAndHeader = function(trans, callback)
{
	glob.db.get("SELECT * FROM texts WHERE langCode = ?", trans("langCode"), function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (typeof data !== "undefined") {
				callback(data);
			} else {
				// If it could find no data, give the default instead:
				glob.db.get("SELECT * FROM texts WHERE langCode = 'default'", function(err, data) {
					if (err) {
						throw(err);
						callback("500");
					} else {
						callback(data);
					}
				});
			}
		}
	});
};

module.exports.bookPassEnabled = function(callback)
{
	glob.db.get("SELECT * FROM data WHERE key = 'bookPassword'", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			console.log(data.value);

			callback(data.value !== "");
		}
	});
};

module.exports.adminLogin = function(params, callback)
{
	glob.db.get("SELECT * FROM adminAccounts WHERE username = ?", params.username, function(err, data) {
		if (err) {
			throw(err);
			callback("Internal Server Error (500)");
		} else if (!data) {
			callback(params.trans("wrongUsernameOrPassword"));
		} else {
			tryLogInAdmin(params.password, data.password, params.username, params.trans, callback);
		}
	});
};

module.exports.getLayout = function(callback)
{
	glob.db.get("SELECT * FROM data WHERE key = 'layout'", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			callback(data.value);
		}
	});
};

module.exports.getSeats = function(callback)
{
	glob.db.all("SELECT * FROM seats", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			callback(data);
		}
	});
};

module.exports.getMyOnHolds = function(params, callback)
{
	glob.db.all("SELECT id FROM seats WHERE holdTo = ?", params.sessionId, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			callback(data);
		}
	});
};

module.exports.updateBookSession = function(sessionId)
{
	return bookSessions.connection(sessionId);
};

module.exports.holdSeat = function(params, callback)
{
	glob.checkIfIdExistsInLayout(params.id, function() {
		glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, data) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				if (typeof data === "undefined") {
					// Make sure a session is started in case the user doesn't send the first request, otherwise the lock will never be removed:
					bookSessions.connection(params.sessionId);

					glob.db.run("INSERT INTO seats (id, status, holdTo) VALUES (?, 'onHold', ?)", [params.id, params.sessionId], function(err) {
						if (err) {
							throw(err);
							callback("500");
						} else {
							bookSessions.notify("seats");
							callback("success");
						}
					});
				} else if (data.status === "reserved") {
					callback("reserved");
				} else {
					callback(params.trans("tookOnHold"));
				}
			}
		});
	}, function(msg) {
		callback(msg);
	});
};

module.exports.unholdSeat = function(params, callback)
{
	glob.db.run("DELETE FROM seats WHERE holdTo = ? AND status = 'onHold'", params.sessionId, function(err) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			bookSessions.notify("seats");
			callback("unhold");
		}
	});
};

module.exports.book = function(params, callback)
{
	if (isNaN(params.id)) {
		callback("400Invalid parameters");
	} else {
		glob.checkIfIdExistsInLayout(params.id, function() {
			params.name = params.name.trim();

			if (glob.nameContainsInvalidChars(params.name)) {
				callback("400" + params.trans("invalidNameField"));
			} else {
				checkBookAvailability(params, callback)
			}
		}, function(msg) {
			callback(msg);
		});
	}
};

function checkBookAvailability(params, callback)
{
	glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (typeof data === "undefined") {
				bookWithBookPass(params, callback);
			} else if (data.status === "onHold") {
				if (data.holdTo === params.sessionId) {
					bookWithBookPass(params, callback);
				} else {
					callback(params.trans("seatOnHold"));
				}
			} else if (data.status === "reserved") {
				bookWithReservedPass(params, callback);
			} else {
				callback(params.trans("alreadyBooked"));
			}
		}
	});
}

function bookWithBookPass(params, callback)
{
	glob.db.get("SELECT * FROM data WHERE key = 'bookPassword'", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			compareBookPasswords(params, callback, data.value);
		}
	});
}

function bookWithReservedPass(params, callback)
{
	glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (!data) {
				console.log("ERROR: Could not find the password for the reserved seat with id: " + params.id);
				callback("500");
			} else {
				compareBookPasswords(params, callback, data.password);
			}
		}
	});
}

function compareBookPasswords(params, callback, password)
{
	if (password === "") {
		book(params, callback);
	} else {
		bcrypt.compare(params.password, password, function(err, valid) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				if (valid)
					book(params, callback);
				else
					callback(params.trans("wrongPassword"));
			}
		});
	}
}

function book(params, callback)
{
	glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (!data) {
				glob.db.run("INSERT INTO seats (id, status, name) VALUES (?, 'booked', ?)", [params.id, params.name], function(err) {
					if (err) {
						throw(err);
						callback("500");
					} else {
						bookSessions.notify("seats");
						callback("success");
					}
				});
			} else {
				glob.db.run("UPDATE seats SET status = 'booked', name = ?, holdTo = null WHERE id = ?", [params.name, params.id], function(err) {
					if (err) {
						throw(err);
						callback("500");
					} else {
						bookSessions.notify("seats");
						callback("success");
					}
				});
			}
		}
	});
}

function tryLogInAdmin(enteredPass, realPassHash, username, trans, callback)
{
	bcrypt.compare(enteredPass, realPassHash, function(err, valid) {
		if (err) {
			throw(err);
			callback("Internal Server Error (500)");
		} else {
			if (valid)
				callback("success", username);
			else
				callback(trans("wrongUsernameOrPassword"));
		}
	});
}
