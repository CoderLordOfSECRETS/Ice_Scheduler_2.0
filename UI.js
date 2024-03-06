document.addEventListener("DOMContentLoaded", function() {
	// Get the dropdown element
	var entryTypeDropdown = document.getElementById("entryType");

	// Get the form elements
	var blackBlockInput = document.getElementById("blackBlockInput");
	var teamInput = document.getElementById("teamInput");

	// Add event listener to the dropdown to detect changes
	entryTypeDropdown.addEventListener("change", function() {
		// Check the selected option value
		if (entryTypeDropdown.value === "blackBlock") {
			// Show black block input, hide team input
			blackBlockInput.style.display = "block";
			teamInput.style.display = "none";
		} else if (entryTypeDropdown.value === "team") {
			// Show team input, hide black block input
			blackBlockInput.style.display = "none";
			teamInput.style.display = "block";
		}
	});
});
