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

// Get the progress container and bar elements
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");

// Function to show the progress bar
function showProgressBar() {
	progressContainer.style.display = "block";
}

// Function to update the progress bar
function updateProgressBar(progress) {
	progressBar.value = progress;
	progressLabel.textContent = `${progress}%`;
}

// Function to hide the progress bar
function hideProgressBar() {
	progressContainer.style.display = "none";
}

// Example usage:
// Call showProgressBar() when the confirm button is clicked to show the progress bar
document.getElementById("confirmButton").addEventListener("click", function() {
	showProgressBar();
	// Example: Simulate progress increasing every second
	let progress = 0;
	const interval = setInterval(function() {
		progress += 10; // Increase progress by 10% every second
		updateProgressBar(progress);
		if (progress >= 100) {
			clearInterval(interval);
			// Example: Hide the progress bar when progress reaches 100%
			hideProgressBar();
		}
	}, 1000);
});
