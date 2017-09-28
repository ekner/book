const glob = require("../global.js");
const bcrypt = require("bcrypt");

var bookSessions;

module.exports.bookSessions = function(_bookSessions)
{
	bookSessions = _bookSessions;
};

module.exports.getStatistics = function(callback)
{
	const statistics = {};
	const dataFromSeats = ["booked", "onHold", "reserved"];
	var total = 0;

	glob.db.get("SELECT * FROM data WHERE key = 'layout'", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			const layout = JSON.parse(data.value);
			var num = 0;

			for (var i = 0; i < layout.length; ++i)
				for (var j = 0; j < layout[i].length; ++j)
					if (layout[i][j].type === "seat")
						++num;

			statistics.numberOfSeats = num;
			dataReceived();
		}
	});

	dataFromSeats.forEach(function(item, index) {
		glob.db.all("SELECT * FROM seats WHERE status = ?", item, function(err, data) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				statistics[item] = data.length;
				dataReceived();
			}
		});
	});

	function dataReceived() {
		if (++total < 4)
			return;

		statistics.empty = statistics.numberOfSeats - statistics.booked - statistics.onHold - statistics.reserved;
		callback(statistics);
	}
};

module.exports.getTextAndLang = function(langCode, trans, callback)
{
	var i = 0;
	var info = {};

	glob.db.get("SELECT * FROM texts WHERE langCode = ?", langCode, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (typeof data === "undefined") {
				callback("400" + trans("langNoExist"));
			} else {
				info.info = data;
				complete();
			}
		}
	});

	glob.db.all("SELECT langCode FROM texts", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			info.lang = data;
			complete();
		}
	});

	function complete() {
		if (++i === 2)
			callback(info);
	}
};

module.exports.setText = function(params, callback)
{
	if (infoTextContainsInvalidChars(params.infoText)) {
		callback("400" + params.trans("infoTextInvalid"));
	} else if (params.infoHeader.indexOf("<") !== -1) {
		callback("400" + params.trans("headerTextInvalid"));
	} else {
		glob.db.run("UPDATE texts SET text = ?, header = ? WHERE langCode = ?", [params.infoText, params.infoHeader, params.langCode], function(err) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				if (this.changes === 0)
					callback("400The language does not exist");
				else
					callback("success");
			}
		});
	}
};

module.exports.addTextLang = function(params, callback)
{
	if (!langCodeValid(params.langCode)) {
		callback("400" + params.trans("langCodeInvalid"));
	} else {
		glob.db.get("SELECT * FROM texts WHERE langCode = ?", params.langCode, function(err, data) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				if (typeof data !== "undefined") {
					callback("400" + params.trans("langCodeExists"));
				} else {
					glob.db.run("INSERT INTO texts VALUES (?, '', '')", params.langCode, function(err) {
						if (err) {
							throw(err);
							callback("500");
						} else {
							callback("success");
						}
					});
				}
			}
		});
	}
};

module.exports.removeTextLang = function(params, callback)
{
	if (params.langCode === "default") {
		callback("400" + params.trans("removeDefaultText"));
		return;
	}

	glob.db.run("DELETE FROM texts WHERE langCode = ?", params.langCode, function(err) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			if (this.changes === 0)
				callback("400" + params.trans("langNoExist"));
			else
				callback("success");
		}
	});
};

module.exports.changeCurrentPassword = function(params, username, callback)
{
	bcrypt.hash(params.password, 10, function(err, hash) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			glob.db.run("UPDATE adminAccounts SET password = ? WHERE username = ?", [hash, username], function(err) {
				if (err) {
					throw(err);
					callback("500");
				} else {
					callback(params.trans("newAdminPassword"));
				}
			});
		}
	});
};

module.exports.changeBookingPassword = function(params, callback)
{
	bcrypt.hash(params.password, 10, function(err, hash) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			glob.db.run("UPDATE data SET value = ? WHERE key = 'bookPassword'", hash, function(err) {
				if (err) {
					throw(err);
					callback("500");
				} else {
					callback(params.trans("newBookPassword"));
				}
			});
		}
	});
};

module.exports.setLayout = function(data, callback)
{
	if (typeof data === "undefined") {
		callback("400");
		return;
	}

	if (!layoutValid(data)) {
		callback("400");
	} else {
		glob.db.run("UPDATE data SET value = ? WHERE key = 'layout'", data, function(err) {
			bookSessions.notify("layout");

			if (err) {
				throw(err);
				callback("500");
			} else {
				callback("success");
			}

			removeLooseSeats();
		});
	}
};

module.exports.toggleOnHold = function(params, callback)
{
	glob.checkIfIdExistsInLayout(params.id, function() {
		glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, data) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				if (typeof data === "undefined") {
					glob.db.run("INSERT INTO seats (id, status, holdTo) VALUES (?, 'onHold', ?)", [params.id, params.sessionId], function(err) {
						if (err) {
							throw(err);
							callback("500");
						} else {
							bookSessions.notify("seats");
							callback("onHold");
						}
					});
				} else if (data.status === "onHold") {
					glob.db.run("DELETE FROM seats WHERE id = ?", params.id, function(err) {
						if (err) {
							throw(err);
							callback("500");
						} else {
							bookSessions.notify("seats");
							callback("empty");
						}
					});
				} else {
					callback(params.trans("nothingChanged"));
				}
			}
		});
	}, function(msg) {
		callback(msg);
	});
};

// Used for unbooking and unreserving:
module.exports.clear = function(params, callback)
{
	glob.db.run("DELETE FROM seats WHERE id = ?", params.id, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			bookSessions.notify("seats");
			callback("success");
		}
	});
};

module.exports.book = function(params, callback)
{
	glob.checkIfIdExistsInLayout(params.id, function() {
		if (glob.nameContainsInvalidChars(params.name)) {
			callback("400" + params.trans("invalidNameField"));
		} else {
			book(params.id, params.name, callback);
		}
	}, function(msg) {
		callback(msg);
	});
};

module.exports.reserve = function(params, callback)
{
	glob.checkIfIdExistsInLayout(params.id, function() {
		// First delete any existing data if there is any:
		glob.db.run("DELETE FROM seats WHERE id = ?", params.id, function(err) {
			if (err) {
				throw(err);
				callback("500");
			} else {
				bookSessions.notify("seats");
				bcrypt.hash(params.password, 10, function(err, hash) {
					if (err) {
						throw(err);
						callback("500");
					} else {
						glob.db.run("INSERT INTO seats (id, password, status) VALUES (?, ?, 'reserved')", [params.id, hash], function(err) {
							if (err) {
								throw(err);
								callback("500");
							} else {
								bookSessions.notify("seats");
								callback("success");
							}
						});
					}
				});
			}
		});
	}, function(msg) {
		callback(msg);
	});
};

module.exports.getSeatDetails = function(params, callback)
{
	glob.db.get("SELECT * FROM seats WHERE id = ?", params.id, function(err, seatData) {
		if (err) {
			throw(err);
			callback("500");
		} else if (typeof seatData === "undefined") {
			callback("404Couldn't find seat");
		} else {
			callback(seatData);
		}
	});
};

function book(seatId, name, callback)
{
	glob.db.run("DELETE FROM seats WHERE id = ?", seatId, function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			bookSessions.notify("seats");
			glob.db.run("INSERT INTO seats (id, name, status) VALUES (?, ?, 'booked')", [seatId, name], function(err, data) {
				if (err) {
					throw(err);
					callback("500");
				} else {
					bookSessions.notify("seats");
					callback("success");
				}
			});
		}
	});
}

function removeLooseSeats(callback)
{
	var seatsData;
	var layoutData;
	var num = 0;
	callback = typeof callback === "undefined" ? function() {} : callback;

	glob.db.all("SELECT * FROM seats", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			seatsData = data;
			processData();
		}
	});

	glob.db.get("SELECT * FROM data WHERE key = 'layout'", function(err, data) {
		if (err) {
			throw(err);
			callback("500");
		} else {
			layoutData = JSON.parse(data.value);
			processData();
		}
	});

	function processData()
	{
		if (++num < 2)
			return;

		var noExistInLayout = [0]; // Remove any eventual data with id == 0
		var idsInLayout = {};

		// Put all the id:s in the layout in one single dimensional array:
		for (var i = 0; i < layoutData.length; ++i)
			for (var j = 0; j < layoutData[i].length; ++j)
				idsInLayout[layoutData[i][j].id] = layoutData[i][j].id;

		// Pick all the id:s from the layout that don't exist in the seats data:
		for (var i = 0; i < seatsData.length; ++i)
			if (typeof idsInLayout[seatsData[i].id] === "undefined")
				noExistInLayout.push(seatsData[i].id);

		// Remove all those seats:
		var executedQueries = 0;
		var result = "success";

		if (noExistInLayout.length > 0) {
			for (var i = 0; i < noExistInLayout.length; ++i) {
				glob.db.run("DELETE FROM seats WHERE id = ?", noExistInLayout[i], function(err) {
					if (err) {
						throw(err);
						result = "500";
					}
					if (++executedQueries === noExistInLayout.length)
						callback(result);
				});
			}
		} else {
			callback("success");
		}
	}
}

function layoutValid(data)
{
	var parsedData;

	if (data.match(/</) !== null)
		return false;

	try {
		parsedData = JSON.parse(data);
	} catch (e) {
		return false;
	}

	if (typeof parsedData !== "object" || !Array.isArray(parsedData)) {
		return false;
	} else {
		for (var i = 0; i < parsedData.length; ++i) {
			if (typeof parsedData[i] !== "object" || !Array.isArray(parsedData[i])) {
				return false;
			} else {
				for (var j = 0; j < parsedData[i].length; ++j) {
					if (typeof parsedData[i][j] !== "object" ||
					    typeof parsedData[i][j].type !== "string" ||
					    typeof parsedData[i][j].id !== "number" ||
				            (parsedData[i][j].type !== "spacer" &&
					     parsedData[i][j].type !== "seat") )
					{
						return false;
					}
				}
			}
		}
	}

	return true;
}

function infoTextContainsInvalidChars(t)
{
	const validTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "b", "br", "hr", "li", "ul", "ol", "ruby", "rt", "s", "samp", "code", "em", "strong", "kbd", "var", "del", "dl", "dt", "dd", "sub", "sup"];
	const validTagsLen = validTags.length;

	// We should also check for invalid end tags:
	for (var i = 0; i < validTagsLen; ++i)
		validTags.push("/" + validTags[i]);

	for (var i = 0; i < t.length; ++i) {
		i = t.indexOf("<", i);

		if (i === -1)
			break;

		var valid = false;
		for (var j = 0; j < validTags.length; ++j) {
			const tag = t.substr(i + 1, validTags[j].length + 1);
			if (tag === validTags[j] + ">" || t.substr(i).search(/<a href="[^<"]*">/) === 0) {
				valid = true;
				break;
			}
		}
		if (!valid)
			return true;
	}

	return false;
}

function langCodeValid(t)
{
	// either like "sv" or "sv-fi"
	return t.match(/^[a-z]{2}$/) !== null || t.match(/^[a-z]{2}-[a-z]{2}$/) !== null;
}
