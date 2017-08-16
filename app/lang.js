const strings = {
        en: require("./lang/en.json"),
        sv: require("./lang/sv.json")
};

module.exports = function(req, res, next)
{
	req.trans = function(str) {
		if (typeof req.headers["accept-language"] === "string")
        	var lang = req.headers["accept-language"].substring(0, 2);
		else
			var lang = "en";

        if (typeof strings["en"][str] === "undefined") {
            console.log("ERROR! Couldn't find translation for '" + str + "'");
            return "Internal Server Error";
        }
    	if (typeof strings[lang] === "undefined") {
            lang = "en";
        }

    	if (typeof strings[lang][str] !== "undefined")
            return strings[lang][str];
        else
            return strings["en"][str]; // Fall back to english
	}
	next();
};
