// Set up drawing elements. RoboroCanvas from advanced.js provides varoius drawing functions:
var canvas = $("#canvas");
var toolbar = $("#toolbar");
var topBar = $("#top-bar");
var totalWidth = $(window).width();
var totalHeight = $(window).height() - topBar.height() - toolbar.height();

canvas.attr("width", totalWidth)
canvas.attr("height", totalHeight);
canvas.css("height", totalHeight + "px");
var rob = new RoboroCanvas("canvas");

var table = {
	squareSize: 25,
	margin: 3,
	data: [],
	startPos: false,
	get width() {
		return Math.floor(totalWidth / (this.squareSize + this.margin))
	},
	get height() {
		return Math.floor(totalHeight / (this.squareSize + this.margin))
	}
};

/*
*  table.data contains the actual layout data, described in docs.txt
*/

function between(x, a, b)
{
	return x >= Math.min(a, b) && x <= Math.max(a, b);
}

function generateEmptyTable()
{
	for (var y = 0; y < table.height; ++y) {
		table.data.push([]);
		for (var x = 0; x < table.width; ++x)
			table.data[y].push({type: "spacer", id: 0});
	}
}

function parseData(json)
{
	var data = JSON.parse(json);

	if (typeof data.length === "undefined" || data.length < 1 ||
	typeof data[0].length === "undefined" && data[0].length < 1) {
		console.log("No existing layout data received.");
		return;
	}

	// We place the existing layout in the middle, therefore calcultate the position:
	var height = data.length;
	var width = data[0].length;
	var startY = Math.floor(table.height/2 - height/2);
	var startX = Math.floor(table.width/2 - width/2);

	for (var y = startY; y < startY + height; ++y)
		for (var x = startX; x < startX + width; ++x)
			table.data[y][x] = data[y-startY][x-startX];
}

function loadData()
{
	$.ajax({
		url: "/api/get-layout",
		success: function(data, status, xhr) {
				parseData(data);
		},
		error: function(xhr, status, err) {
			alert(trans("couldNotLoadTheData") + ": " + xhr.responseText);
		}
	});
}

function drawSquares(hl) // hl: Tells which squares should be HighLighted, if any
{
	for (var y = 0; y < table.data.length; ++y) {
		for (var x = 0; x < table.data[y].length; ++x) {
			var xCord = x * (table.margin + table.squareSize);
			var yCord = y * (table.margin + table.squareSize);
			if (typeof hl !== "undefined" && between(x, hl.x1, hl.x2) && between(y, hl.y1, hl.y2) )
				rob.rectangle(xCord, yCord, table.squareSize, table.squareSize, "gray");
			else if (table.data[y][x].type === "seat")
				rob.rectangle(xCord, yCord, table.squareSize, table.squareSize, "blue");
			else
				rob.rectangle(xCord, yCord, table.squareSize, table.squareSize, "lightblue");
		}
	}
}

function getPos(pos)
{
	if (pos.x < 0 || pos.x > totalWidth || pos.y < 0 || pos.y > totalHeight)
		return false;
	var x = Math.floor(pos.x/(table.squareSize + table.margin));
	var y = Math.floor(pos.y/(table.squareSize + table.margin));
	if (pos.x % (table.squareSize + table.margin) > table.squareSize)
		return false;
	if (pos.y % (table.squareSize + table.margin) > table.squareSize)
		return false;
	if (x >= table.width || y >= table.height)
		return false;
	return {x: x, y: y};
}

function togglePos(pos)
{
	if (table.data[pos.y][pos.x].type === "spacer")
		table.data[pos.y][pos.x].type = "seat";
	else
		table.data[pos.y][pos.x].type = "spacer";
}

function getOuterBounds()
{
	var bounds = {
		startX: table.width,
		startY: table.height,
		endX: 0,
		endY: 0
	};
	var id = 0;

	for (var y = 0; y < table.data.length; ++y) {
		var rightMost = 0;
		for (var x = 0; x < table.data[y].length; ++x) {
			if (table.data[y][x].type === "seat") {
				rightMost = x;
				bounds.endY = y;
				if (x < bounds.startX)
					bounds.startX = x;
				if (y < bounds.startY)
					bounds.startY = y;
				if (table.data[y][x].id > id)
					id = table.data[y][x].id;
			}
		}
		if (rightMost > bounds.endX)
			bounds.endX = rightMost;
	}

	return {bounds: bounds, highestId: id};
}

function clearTable()
{
	table.data = [];
	generateEmptyTable();
}

function generate()
{
	var ret = getOuterBounds();
	var bounds = ret.bounds;
	var id = ret.highestId;
	var gen = [];

	for (var y = bounds.startY; y < bounds.endY + 1; ++y) {
		gen.push([]);
		for (var x = bounds.startX; x < bounds.endX + 1; ++x) {
			gen[y - bounds.startY][x - bounds.startX] = table.data[y][x];

			if (table.data[y][x].type === "spacer")
				gen[y - bounds.startY][x - bounds.startX].id = 0;

			if (table.data[y][x].type === "seat" && table.data[y][x].id === 0)
				gen[y - bounds.startY][x - bounds.startX].id = ++id;
		}
	}

	$.ajax({
		url: "/api/admin/set-layout",
		method: "POST",
		contentType: "text/plain; charset=UTF-8",
		data: JSON.stringify(gen),
		success: function(data, status, xhr) {
				location.reload();
		},
		error: function(xhr, status, err) {
			alert(trans("couldNotLoadTheData") + ": " + xhr.responseText);
		}
	});
}

rob.update = function()
{
	var pos = getPos(rob.mouse);
	if (pos) {
		if (!table.startPos)
			drawSquares({x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y});
		else
			drawSquares({x1: table.startPos.x, y1: table.startPos.y, x2: pos.x, y2: pos.y});

		document.body.style.cursor = "pointer";
	} else {
		drawSquares();
		document.body.style.cursor = "default";
	}
}

function start()
{
	generateEmptyTable();
	loadData();
	startEvents();
}

function startEvents()
{
	rob.updatesPerSecond = 30;

	canvas.on("mousedown", function() {
		var pos = getPos(rob.mouse);
		if (pos)
			table.startPos = pos;
	});

	canvas.on("mouseup", function() {
		var endPos = getPos(rob.mouse);
		if (endPos && table.startPos)
			for (var i = Math.min(table.startPos.y, endPos.y); i <= Math.max(table.startPos.y, endPos.y); ++i)
				for (var j = Math.min(table.startPos.x, endPos.x); j <= Math.max(table.startPos.x, endPos.x); ++j)
					togglePos({x: j, y: i});
		table.startPos = false;
	});
}

var actions = {
	save: function() {
		generate();
	},
	cancel: function() {
		location.reload();
	},
	clear: function() {
		clearTable();
	}
};
