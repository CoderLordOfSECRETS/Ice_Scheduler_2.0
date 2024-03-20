document.addEventListener("DOMContentLoaded", function() {
	// Get the dropdown element
	var entryTypeDropdown = document.getElementById("entryType");

	// Get the form elements
	var blackBlockInput = document.getElementById("blackBlockInput");
	var teamInput = document.getElementById("teamInput");
	var submitBlackBlockButton = document.getElementById("submitBlackBlock");
	var submitTeamButton = document.getElementById("submitTeam");

	// Hide both buttons initially
	submitBlackBlockButton.style.display = "none";
	submitTeamButton.style.display = "none";

	// Add event listener to the dropdown to detect changes
	entryTypeDropdown.addEventListener("change", function() {
		// Check the selected option value
		if (entryTypeDropdown.value === "blackBlock") {
			// Show black block input, hide team input
			blackBlockInput.style.display = "block";
			teamInput.style.display = "none";
			// Show submitBlackBlockButton, hide submitTeamButton
			submitBlackBlockButton.style.display = "block";
			submitTeamButton.style.display = "none";
		} else if (entryTypeDropdown.value === "team") {
			// Show team input, hide black block input
			blackBlockInput.style.display = "none";
			teamInput.style.display = "block";
			// Show submitTeamButton, hide submitBlackBlockButton
			submitTeamButton.style.display = "block";
			submitBlackBlockButton.style.display = "none";
		}
	});

	// Trigger change event on page load to hide/show buttons based on initial entry type
	var event = new Event("change");
	entryTypeDropdown.dispatchEvent(event);
});
