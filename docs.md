The seat data, in the "seats" table, and the layout data, a single entity in the "data" table,
are separated. If a seat is empty, there should be no entry in the seats table for that seat.

"seats" table:

	id:		<int>
	status:		"booked" | "reserved" | "onHold"
	holdTo:		<str> // used if status === onHold
	name:		<str> // used if status === booked
	email:		<str> // used if status === booked
	password:	<str> // used if status === reserved

The layout data is a 2-dimensional array (JSON),
where each object looks like:

	{type: "spacer|seat", id: int}


## Notes about coding style:

* **Tabs** for indentation
* **Spaces** for alignment
* Curly brackets should be on a separate lines on global scope functions
* In all other cases, they should be on the same line
* camelCase for variable names, but not for CSS and in URLs, use dash there instead: test-var
