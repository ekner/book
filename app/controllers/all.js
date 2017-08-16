const express = require("express");
const model = require("../models/all.js");
const glob = require("../global.js");

const router = express.Router();
var bookSessions;

module.exports.bookSessions = function(_bookSessions)
{
	bookSessions = _bookSessions;
	model.bookSessions(_bookSessions);
};

router.get("/", function(req, res)
{
	model.getInfoTextAndHeader(req.trans, function(data) {
		if (data === "500")
			glob.send(res, data);
		else
			res.render("all/index.ejs", {info: data, trans: req.trans});
	});
});

router.get("/book", function(req, res)
{
	model.bookPassEnabled(function(data) {
		if (data === "500")
			glob.send(res, data);
		else
			res.render("all/book.ejs", {trans: req.trans, bookPassEnabled: data});
	});
});

router.get("/admin-login", function(req, res)
{
	if (typeof req.session.login === "undefined" || req.session.login === "") {
		if (typeof req.session.loginMsg !== "undefined") {
			const tempMsg = req.session.loginMsg;
			delete req.session.loginMsg;
			res.render("all/login.ejs", {msg: tempMsg, trans: req.trans});
		} else
			res.render("all/login.ejs", {trans: req.trans});
	} else {
		res.redirect("/");
	}
});

/* ------------------ API: ------------------ */

router.post("/api/admin-login", function(req, res)
{
	glob.params(req, res, ["username", "password"], function(params) {
		model.adminLogin(params, function(result, username) {
			if (result === "success") {
				req.session.login = "admin";
				req.session.username = username;
				res.render("all/redirect.ejs", {url: "/admin", trans: req.trans}); // We can't use res.redirect directly because then the session variables won't be set.
			} else {
				req.session.loginMsg = result;
				res.render("all/redirect.ejs", {url: "/admin-login", trans: req.trans});
			}
		});
	});
});

router.get("/api/admin-logout", function(req, res)
{
	if (typeof req.session.login !== "undefined" && req.session.login !== "") {
		req.session.login = undefined;
		req.session.username = undefined;
	}

	res.render("all/redirect.ejs", {url: "/", trans: req.trans});
});

router.get("/api/get-layout", function(req, res)
{
	model.getLayout(function(data) {
		glob.send(res, data);
	});
});

router.get("/api/get-seats", function(req, res)
{
	model.getSeats(function(data) {
		glob.send(res, data);
	});
});

router.get("/api/get-my-on-holds", function(req, res)
{
	glob.params(req, res, [], function(params) {
		model.getMyOnHolds(params, function(data) {
			glob.send(res, data);
		});
	});
});

router.get("/api/get-table", function(req, res)
{
	model.getLayout(function(data) {
		if (data !== "500")
			res.render("all/seats.ejs", {layout: JSON.parse(data), trans: req.trans});
		else
			glob.send(res, "500");
	});
});

router.post("/api/update-book-session", function(req, res)
{
	const updateStatus = model.updateBookSession(req.sessionID);
	res.send(updateStatus);
});

router.post("/api/hold-seat", function(req, res)
{
	glob.params(req, res, ["id"], function(params) {
		model.holdSeat(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/unhold-seat", function(req, res)
{
	glob.params(req, res, [], function(params) {
		model.unholdSeat(params, function(result) {
			glob.send(res, result);
		});
	});
});

router.post("/api/book", function(req, res)
{
	glob.params(req, res, ["name", "password", "id"], function(params) {
		model.book(params, function(result) {
			glob.send(res, result);
		});
	});
});

module.exports.router = router;
