document.addEventListener("DOMContentLoaded", function() {
	// Get the dropdown element
	const entryTypeDropdown = document.getElementById("entryType");

	// Get the form elements
	const blackBlockInput = document.getElementById("blackBlockInput");
	const teamInput = document.getElementById("teamInput");
	const submitBlackBlockButton = document.getElementById("submitBlackBlock");
	const submitTeamButton = document.getElementById("submitTeam");
	const teamnameInput = document.getElementById("teamName")

	// Hide both buttons initially
	submitBlackBlockButton.style.display = "none";
	submitTeamButton.style.display = "none";

	// Function to show/hide the appropriate inputs based on the selected entry type
	function toggleInputVisibility() {
		if (entryTypeDropdown.value === "blackBlock") {
			blackBlockInput.style.display = "block";
			teamInput.style.display = "none";
			// Show submitBlackBlockButton, hide submitTeamButton
			submitBlackBlockButton.style.display = "block";
			submitTeamButton.style.display = "none";
		} else if (entryTypeDropdown.value === "team") {
			blackBlockInput.style.display = "none";
			teamInput.style.display = "block";
			// Show submitTeamButton, hide submitBlackBlockButton
			submitTeamButton.style.display = "block";
			submitBlackBlockButton.style.display = "none";
		}
	}

	// Add event listener to the dropdown to detect changes
	entryTypeDropdown.addEventListener("change", toggleInputVisibility);

	// Trigger change event on page load to hide/show appropriate inputs based on initial entry type
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
