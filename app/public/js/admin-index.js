function changeBookingPass()
{
        promptPassword(trans("enterNewPassword"), function(password) {
                if (password === null)
                        return;

                $.ajax({
        		type: "POST",
                        data: {password: password},
        		url: "/api/admin/change-booking-password",
        		success: function(data) {
        			alert(data);
        		},
        		error: function(xhr, status, error) {
                                alert(xhr.responseText);
        		}
        	});
        });
}

function changeAdminPass()
{
        promptPassword(trans("enterNewPassword"), function(password) {
                if (password === null)
                        return;

                $.ajax({
        		type: "POST",
                        data: {password: password},
        		url: "/api/admin/change-current-password",
        		success: function(data) {
        			alert(data);
        		},
        		error: function(xhr, status, error) {
                                alert(xhr.responseText);
        		}
        	});
        });
}
