const express = require("express");
const model = require("../models/admin.js");
const glob = require("../global.js");

const router = express.Router();
var bookSessions;

module.exports.bookSessions = function(_bookSessions)
{
	bookSessions = _bookSessions;
	model.bookSessions(_bookSessions);
};

router.use("/admin", checkAuthPages);
router.use("/api/admin", checkAuthAPI);

router.get("/admin", function(req, res)
{
	model.getStatistics(function(data) {
		if (data === "500")
			glob.send(res, data);
		else
			res.render("admin/index.ejs", {statistics: data, trans: req.trans});
	});
});

router.get("/admin/edit-layout", function(req, res)
{
	res.render("admin/edit-layout.ejs", {trans: req.trans});
});

router.get("/admin/edit-seats", function(req, res)
{
	res.render("admin/edit-seats.ejs", {trans: req.trans});
});

router.get("/admin/edit-info-text", function(req, res)
{
	const langCode = typeof req.query.langCode !== "undefined" ? req.query.langCode : "default";

	model.getTextAndLang(langCode, req.trans, function(data) {
		if (glob.errorHappened(data)) {
			glob.send(res, data);
		} else {
			data.trans = req.trans;
			data.currentLang = langCode;
			res.render("admin/edit-info-text.ejs", data);
		}
	});
});

/* ------------------ API: ------------------ */

router.post("/api/admin/set-text", function(req, res)
{
	glob.params(req, res, ["infoText", "infoHeader", "langCode"], function(params) {
		model.setText(params, function(data) {
			glob.send(res, data);
		});
	});
});

router.post("/api/admin/add-text-lang", function(req, res)
{
	glob.params(req, res, ["langCode"], function(params) {
		model.addTextLang(params, function(data) {
			glob.send(res, data);
		});
	});
});

router.post("/api/admin/remove-text-lang", function(req, res)
{
	glob.params(req, res, ["langCode"], function(params) {
		model.removeTextLang(params, function(data) {
			glob.send(res, data);
		});
	});
});

router.post("/api/admin/change-current-password", function(req, res)
{
	glob.params(req, res, ["password"], function(params) {
		model.changeCurrentPassword(params, req.session.username, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/change-booking-password", function(req, res)
{
	glob.params(req, res, ["password"], function(params) {
		model.changeBookingPassword(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/set-layout", function(req, res)
{
	model.setLayout(req.body, function(result) {
		glob.send(res, result);
	});
});

router.post("/api/admin/toggle-on-hold", function(req, res)
{
	glob.params(req, res, ["id"], function(params) {
		model.toggleOnHold(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/clear", function(req, res)
{
	glob.params(req, res, ["id"], function(params) {
		model.clear(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/book", function(req, res)
{
	glob.params(req, res, ["id", "name"], function(params) {
		model.book(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/reserve", function(req, res)
{
	glob.params(req, res, ["id", "password"], function(params) {
		model.reserve(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/toggle-arrived-status", function(req, res)
{
	glob.params(req, res, ["id"], function(params) {
		model.toggleArrivedStatus(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/admin/get-seat-details", function(req, res)
{
	glob.params(req, res, ["id"], function(params) {
		model.getSeatDetails(params, function(seatData) {
			if (seatData === "500" || seatData === "404")
				glob.send(res, seatData);
			else
				res.render("admin/seat-details.ejs", {seatData: seatData, trans: req.trans});
		});
	});
});

function checkAuthPages(req, res, next)
{
	if (req.session.login !== undefined && req.session.login === "admin")
		next();
	else
		res.redirect("/admin-login");
}

function checkAuthAPI(req, res, next)
{
	if (req.session.login !== undefined && req.session.login === "admin")
		next();
	else
		res.status(403).send("You are not logged in.");
}

module.exports.router = router;
