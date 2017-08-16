$("#add-lang form").submit(function(e) {
	e.preventDefault();
	$.ajax({
		type: "POST",
		data: $(this).serialize(),
		url: "/api/admin/add-text-lang",
		success: function(data) {
			location.reload();
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
});

function removeLang()
{
	const currentLang = $("#currentLang").val();
	$.ajax({
		type: "POST",
		data: {langCode: currentLang},
		url: "/api/admin/remove-text-lang",
		success: function(data) {
			location = location.pathname;
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

function updateInfo()
{
	const currentLang = $("#currentLang").val();
	const infoHeader = $("#info-header").val();
	const infoText = $("#info-text").val();

	$.ajax({
		type: "POST",
		data: {infoText: infoText, infoHeader: infoHeader, langCode: currentLang},
		url: "/api/admin/set-text",
		success: function(data) {
			location.reload();
		},
		error: function(xhr, status, error) {
			displayMsg(xhr.responseText);
		}
	});
}

function cancel()
{
	location.reload();
}

/*

function setInfoText()
{
        const infoText = $("#info-text").val();

        $.ajax({
                type: "POST",
                data: {infoText: infoText},
                url: "/api/admin/set-info-text",
                success: function(data) {
                        location.reload();
                },
                error: function(xhr, status, error) {
                        displayMsg(xhr.responseText);
                }
        });
}

function setHeaderText()
{
        const headerText = $("#header-text").val();

        $.ajax({
                type: "POST",
                data: {headerText: headerText},
                url: "/api/admin/set-header-text",
                success: function(data) {
                        location.reload();
                },
                error: function(xhr, status, error) {
                        displayMsg(xhr.responseText);
                }
        });
}*/
