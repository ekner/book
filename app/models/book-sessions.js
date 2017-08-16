const glob = require("../global.js");
var sessions = {};

resetAllSeatsOnHold();

function Session(id)
{
	this.id = id;
	this.updateSeats = false;
	this.updateLayout = false;
	this.timeout = null;

	var thisSession = this;
	sessions[this.id] = this;

	var timeoutFun = function() {
		delete sessions[id];

		// If this session has set any holdTo value in the db, remove it so others can book that seat:
		glob.db.run("DELETE FROM seats WHERE holdTo = ?", id, function(err) {
			if (err)
				throw(err);
		});
	};

	this.renew = function() {
		clearTimeout(thisSession.timeout);
		thisSession.timeout = setTimeout(timeoutFun, 10000);

		return {updateSeats: thisSession.updateSeats, updateLayout: thisSession.updateLayout};
	};

	this.resetUpdateValues = function() {
		thisSession.updateSeats = false;
		thisSession.updateLayout = false;
	};
}

function resetAllSeatsOnHold()
{
	glob.db.run("DELETE FROM seats WHERE status = 'onHold'", function(err) {
		if (err)
			throw(err);
	});
}

module.exports.connection = function(id)
{
	if (!sessions[id])
		new Session(id);

	var updateStatus = sessions[id].renew();
	sessions[id].resetUpdateValues();
	return updateStatus;
};

// This function should be called to inform all clients that a change has been made and that they should update.
module.exports.notify = function(updateTarget)
{
	for (var key in sessions) {
		if (!sessions.hasOwnProperty(key))
			continue;
		if (updateTarget === "seats")
			sessions[key].updateSeats = true;
		else if (updateTarget === "layout")
			sessions[key].updateLayout = true;
	}
};
