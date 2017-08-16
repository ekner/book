/* Translation and language code: */

const langCode = navigator.language.substring(0, 2);

var primaryStrings;
var secondaryStrings;
var stringsLoaded = false;

$.getJSON("/lang/en.json", function(data) {
        secondaryStrings = data;

        if (langCode === "en") {
                primaryStrings = secondaryStrings;
                stringsLoaded = true;
        } else {
                $.getJSON("/lang/" + langCode + ".json", function(data) {
                        primaryStrings = data;
                        stringsLoaded = true;
                });
        }
});

function trans(str)
{
        if (!stringsLoaded)
                return "Loading...";

        if (typeof secondaryStrings[str] === "undefined") {
                console.log("ERROR! There is no translation for the string: " + str);
                return "ERROR";
        }

        if (typeof primaryStrings[str] !== "undefined")
                return primaryStrings[str];
        else
                return secondaryStrings[str];
}

/* displayMsg: */

var displayMsg = (function ()
{
	var timeout = false;

	return function (msg) {
		if (timeout)
			clearTimeout(timeout);
		showBox(msg);
        	timeout = setTimeout(hideBox, 10000);
	}

	function showBox(msg) {
		$("#msg-box").show();
		$("#msg-box p").html(msg);
	}

	function hideBox() {
		$("#msg-box").hide();
		$("#msg-box p").html("");
	}
})();

/* promptPassword */

var promptPassword = (function ()
{
	return function (msg, callback) {
                $("#prompt-password").css("display", "block");
                $("#overlay").css("display", "block");
                $("#prompt-password-ok").unbind();
                $("#prompt-password-cancel").unbind();
                $("#prompt-password-header").html(msg);

                $("#prompt-password-ok").click(function() {
                        callback($("#prompt-password-text").val());
                        clean();
                });

                $("#prompt-password-cancel").click(function() {
                        callback(null);
                        clean();
                });
	}

        function clean() {
                $("#prompt-password-text").val("");
                $("#prompt-password").css("display", "none");
                $("#overlay").css("display", "none");
                $("#prompt-password-header").html("");
        }
})();
