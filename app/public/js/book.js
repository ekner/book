$("#book #close").click(function() {
	$("#book").css("display", "none");
	$.ajax({type: "POST", url: "/api/unhold-seat"});
	getSeatsInfo();
});

function holdSeat(xCord, yCord, seatId)
{
	$.ajax({
		type: "POST",
		url: "/api/hold-seat",
		data: {id: seatId},
		success: function(data) {
			getSeatsInfo();
			if (data === "success" || data === "reserved") {
				displayBookForm(xCord, yCord, seatId);
			} else {
				displayMsg(data);
			}
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

seatsJS.additionalClickEvent = function()
{
	$("#seats td[data-status='empty'] > div, #seats td[data-status='reserved'] > div").click(function(e) {
		var seatId = $(this).find("p").html();

		$.ajax({
			type: "POST",
			url: "/api/unhold-seat",
			success: function() {
				holdSeat(e.clientX, e.clientY, seatId);
			},
			error: function(xhr, status, error) {
				displayMsg(xhr.responseText);
			}
		});
	});
};

function displayBookForm(x, y, seatId)
{
	const margin = "50px";
	var right = x <= $(document).width() / 2;
	var bottom = y <= $(document).height() / 2;

	$("#book").css("right", right ? margin : "auto");
	$("#book").css("left", right ? "auto" : margin);

	$("#book").css("bottom", bottom ? margin : "auto");
	$("#book").css("top", bottom ? "auto" : margin);

	$("#book").css("display", "block");

	$("#book-id").val(seatId);
	$("#book-num").html(seatId);
}

$("#submit").click(function(e) {
	e.preventDefault();
	$.ajax({
		type: "POST",
		url: "/api/book",
		data: $("#book-form").serialize(),
		success: function(data) {
			if (data !== "success") {
				displayMsg(data);
			} else {
				$("#book-form")[0].reset();
				$("#book").hide();
				getSeatsInfo(function() {
					reloadEvents(displayBookForm);
				});
				displayMsg(trans("successBooked"));
			}
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
});
