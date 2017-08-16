seatsJS.additionalClickEvent = function()
{
	$("#seats td[data-status='empty'] > div, #seats td[data-status='onHold']:not(.my-on-hold) > div").click(function(e) {
		var seatId = $(this).find("p").html();
		toggleOnHold(seatId);
	});
        $("#seats td[data-status='reserved'] > div, #seats td[data-status='booked'] > div, #seats td[data-status='onHold'].my-on-hold > div").click(function(e) {
		var seatId = $(this).find("p").html();
		displaySeatDetails(seatId);
	});
};

document.addEventListener("keyup", function(e) {
	// ESC:
	if (e.keyCode === 27) {
		unholdCurrentDetailsSeat();
	}
	// "a":
	if (e.keyCode === 65) {
		unHoldAllSeats(function() {
			getSeatsInfo();
		});
	}
});

function unholdCurrentDetailsSeat()
{
	const id = Number($("#seat-details-container h1").html());
	if (!isNaN(id)) {
		toggleOnHold(id);
		$("#seat-details-container").empty();
	}
}

function book(seatId)
{
	const name = prompt(trans("enterName"));
	if (name === null)
		return;
	action("book", {id: seatId, name: name}, function() {
		updateSeatDetails();
	});
}

function reserve(seatId)
{
	const password = prompt(trans("enterPass"));
	if (password === null)
		return;
	action("reserve", {id: seatId, password: password}, function() {
		updateSeatDetails();
	});
}

function clearSeat(seatId)
{
	action("clear", {id: seatId}, function() {
		$("#seat-details-container").empty();
	});
}

function action(action, data, callback)
{
	$.ajax({
		type: "POST",
		data: data,
		url: "/api/admin/" + action,
		success: function(data) {
			if (data === "success")
				getSeatsInfo();
			else
				displayMsg(data);
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		},
		complete: callback
	});
}

function updateSeatDetails()
{
	const id = Number($("#seat-details-container h1").html());
	if (!isNaN(id)) {
		displaySeatDetails(id);
	}
}

function displaySeatDetails(id)
{
	$.ajax({
		type: "POST",
		data: {id: id},
		url: "/api/admin/get-seat-details",
		success: function(data) {
			$("#seat-details-container").empty().append(data);
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

function toggleOnHold(seatId)
{
	$.ajax({
		type: "POST",
		url: "/api/admin/toggle-on-hold",
		data: {id: seatId},
		success: function(data) {
			getSeatsInfo();

			if (data === "onHold") {
				displaySeatDetails(seatId);
			} else if (data !== "empty") {
                                displayMsg(data);
                        }
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}
