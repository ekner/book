// seats data will be inserted here:
var seatsInfo = [];
var interval = setInterval(updateBookSession, 5000);
var seatsJS = {
	additionalClickEvent: function() {},
	additionalUpdateEvent: function() {}
}

getTable(function() {
	getSeatsInfo();
	updateBookSession();
});

$("body").append('<div id="hover"><h2 id="hover-status"></h2><h3 id="hover-extra"></h3></div>');

window.addEventListener("beforeunload", function()
{
	clearInterval(interval);
	$.ajax({type: "POST", url: "/api/unhold-seat"});
});

function unHoldAllSeats(callback)
{
	$.ajax({
		type: "POST",
		url: "/api/unhold-seat",
		success: function() {
			if (typeof callback !== "undefined")
				callback();
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

function fixTableLayout()
{
	const rows = $("#seats tr").length;
	const cols = $("#seats tr").first().children().length;
	const totalHeight = $("#seats").height();
	const totalWidth = $("#seats").width();
	const squaresPerHeight = rows/totalHeight;
	const squaresPerWidth = cols/totalWidth;

	var squareSize;

	if (squaresPerHeight >= squaresPerWidth)
		squareSize = totalHeight/rows;
	else
		squareSize = totalWidth/cols;

	$("#seats").css("width", squareSize * cols + "px");
	$("#seats").css("height", squareSize * rows + "px");
	$("#seats tr").css("height", squareSize + "px");

	$("#seats").css("font-size", squareSize/3 + "px");
}

function insertTable(data)
{
	$("#seats-container").empty();
	$("#seats-container").append(data);
	fixTableLayout();
}

function getTable(callback)
{
	$.ajax({
		url: "/api/get-table",
		success: function(data, status, xhr) {
			insertTable(data);
			if (typeof callback !== "undefined")
				callback();
		},
		error: function(xhr, status, err) {
			displayMsg(xhr.responseText);
		}
	});
}

function updateBookSession()
{
	$.ajax({
		type: "POST",
		url: "/api/update-book-session",
		success: function(data) {
			if (data.updateSeats === true) {
				seatsJS.additionalUpdateEvent("seats");
				getSeatsInfo();
			} else if (data.updateLayout === true) {
				seatsJS.additionalUpdateEvent("layout");
				getTable(function() {
					getSeatsInfo();
				});
			}
		},
		error: function(xhr, status, err) {
			displayMsg(xhr.responseText || trans("sessionUpdateError"));
		}
	});
}

// Call this function to get and display new seat data. This will not get the whole new layout if that has been changed.
function getSeatsInfo()
{
	$.ajax({
		type: "GET",
		url: "/api/get-seats",
		success: function(data) {
			insertSeatsData(data);
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});

	$.ajax({
		type: "GET",
		url: "/api/get-my-on-holds",
		success: function(data) {
			insertMyOnHolds(data);
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

function insertSeatsData(data)
{
	$("#seats td:not([data-status='spacer'])").attr("data-status", "empty");
	$("#seats td").attr("data-is-here", "0");

	for (var i = 0; i < data.length; ++i) {
		var elem = $("#id-" + data[i].id);
		elem.attr("data-status", data[i].status);
		elem.attr("data-is-here", data[i].isHere);
	}

	seatsInfo = [];
	for (var i = 0; i < data.length; ++i) {
		seatsInfo[data[i].id] = data[i];
	}

	reloadEvents();
}

function insertMyOnHolds(data)
{
	$("#seats td").removeClass("my-on-hold");

	for (var i = 0; i < data.length; ++i) {
		var elem = $("#id-" + data[i].id);
		elem.addClass("my-on-hold");
	}
}

function reloadEvents()
{
	// Remove all previous event listeners:
	$("#seats td > div").unbind();

	$("#seats td:not([data-status='spacer']) > div").mouseenter(function(e) {
		var status = $(this).parent().attr("data-status");
		var name = "";

		if (status === "booked") {
			var id = $(this).find("p").html();
			name = seatsInfo[id].name;
			status = trans("booked");
		} else if (status === "onHold") {
			status = trans("onHold");
		} else if (status === "reserved") {
			status = trans("reserved");
		} else if (status === "empty") {
			status = trans("empty");
		}
		status = status.charAt(0).toUpperCase() + status.slice(1);

		$("#hover").css("display", "block");
		$("#hover-status").html(status);
		$("#hover-extra").html(name);
	});

	$("#seats td:not([data-status='spacer']) > div").mousemove(function(e) {
		const margin = 12;

		$("#hover").css("top", e.clientY + margin);
		$("#hover").css("left", e.clientX + margin);
	});

	$("#seats td:not([data-status='spacer']) > div").mouseleave(function(e) {
		$("#hover").css("display", "none");
	});

	seatsJS.additionalClickEvent();
}
