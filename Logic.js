//Element entry zone
const progressBar = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");


let metcalfeTeams = [];
let scheduledPractices;
let blackBlocks = [];
let progress = 0;

async function fetchAndProcessGameSchedule(link) {
	try {
		const response = await fetch(
			link,
		);
		if (!response.ok) {
			throw new Error("Network response was not ok.");
		}
		const csvData = await response.text();
		const lines = csvData.split("\n").slice(1);

		function parseGameScheduleLine(line) {
			const [
				division,
				gameId,
				date,
				time,
				venue,
				homeTeam,
				awayTeam,
				gameStatus, // New field added for Game Status
			] = line.split('","').map((entry) => entry.replace(/"/g, ""));

			// Check if any essential field is undefined or empty
			if (
				division === undefined ||
				gameId === undefined ||
				date === undefined ||
				time === undefined ||
				venue === undefined ||
				homeTeam === undefined ||
				awayTeam === undefined ||
				gameStatus === undefined
			) {
				// If any field is undefined, return null to indicate incomplete data
				return null;
			}

			return {
				division,
				gameId,
				date,
				time,
				venue,
				homeTeam: sanitizeTeamName(homeTeam),
				awayTeam: sanitizeTeamName(awayTeam),
				gameStatus, // Include the new field in the returned object
			};
		}

		const parsedGameSchedule = lines
			.map(parseGameScheduleLine)
			.filter((game) => game !== null); // Filter out null (undefined or incomplete data)
		console.log("Game schedule complete");
		return parsedGameSchedule;
	} catch (error) {
		console.error("There was a problem fetching the schedule:", error);
		alert("There was a problem fetching the schedule. Please try again."); // Inform the user about the error
		return []; // Return empty array or handle the error case
	}
}

async function UnifySchedules() {
	let parsedGameSchedule = await fetchAndProcessGameSchedule("https://ttmwebservices.ca/schedules/index.php?pgid=dnl-11-010&dtype=CSV&AID=HEO&JID=district9&pcode=15679761017023700001&ddtype=&stype=2&atype=");
	const PlayoffSchedule = await fetchAndProcessGameSchedule("https://ttmwebservices.ca/schedules/index.php?pgid=dnl-11-010&dtype=CSV&AID=HEO&JID=district9&pcode=15838414804934000001&ddtype=&stype=2&atype=");
	if (PlayoffSchedule) {
		parsedGameSchedule = parsedGameSchedule.concat(PlayoffSchedule);
	}
	return parsedGameSchedule
}

// Handle ice slot upload and process content
let iceSlots = [];
function handleIceSlotUpload() {
	const fileInput = document.getElementById("iceSlotInput");
	const file = fileInput.files[0];

	if (file) {
		const reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(event) {
			const content = event.target.result;
			iceSlots = parseIceSlotData(content);
			if (iceSlots.length > 0) {
				console.log("Uploaded Ice Slots:", iceSlots);
				progress = 25;
				updateProgressBar();
				schedulePractices(); // Trigger scheduling after ice slots upload
			} else {
				console.error("No ice slots found in the uploaded file.");
			}
		};
	} else {
		console.error("No file selected.");
	}
}

// Parse ice slot data
function parseIceSlotData(content) {
	try {
		const lines = content.split("\n").slice(1); // Remove header line

		const iceSlots = lines
			.map((line, index) => {
				const [arena, dateString, startTime, endTime] = line.split(",");

				if (!arena || !dateString || !startTime || !endTime) {
					console.error(
						`Skipped invalid ice slot data at line ${index + 2
						}: Incomplete data.`,
					);
					return null;
				}

				const dateFormats = [
					"YYYY-MM-DD",
					"MM/DD/YYYY",
					"YYYY-MM-DD HH:mm:ss",
					"YYYY-MM-DD HH:mm",
					"YYYY-MM-DDTHH:mm:ss",
					"YYYY-MM-DDTHH:mm",
					"YYYY/MM/DD HH:mm:ss",
					"YYYY/MM/DD HH:mm",
					"YYYY/MM/DDTHH:mm:ss",
					"YYYY/MM/DDTHH:mm",
					"MM/DD/YYYY HH:mm:ss",
					"MM/DD/YYYY HH:mm",
					"MM/DD/YYYYTHH:mm:ss",
					"MM/DD/YYYYTHH:mm",
					// Add more date formats here as needed
				];

				let startDateTime, endDateTime;
				let formatIndex = 0;

				while (!startDateTime && formatIndex < dateFormats.length) {
					startDateTime = moment(
						`${dateString.trim()} ${startTime.trim()}`,
						`${dateFormats[formatIndex]} HH:mm`,
					);
					endDateTime = moment(
						`${dateString.trim()} ${endTime.trim()}`,
						`${dateFormats[formatIndex]} HH:mm`,
					);
					formatIndex++;
				}

				if (
					!startDateTime ||
					!startDateTime.isValid() ||
					!endDateTime ||
					!endDateTime.isValid()
				) {
					console.error(
						`Skipped invalid ice slot data at line ${index + 2
						}: Invalid date or time format.`,
					);
					return null;
				}

				if (endDateTime.isBefore(startDateTime)) {
					console.error(
						`Skipped invalid ice slot data at line ${index + 2
						}: End time is before start time.`,
					);
					return null;
				}

				return {
					arena: arena.trim(),
					startDateTime,
					endDateTime,
				};
			})
			.filter((slot) => slot !== null); // Remove null entries

		// Call iceSlotSplitter function to split long ice slots
		const processedIceSlots = iceSlotSplitter(iceSlots);

		return processedIceSlots;
	} catch (error) {
		console.error("Error parsing ice slots:", error.message);
		return [];
	}
}

function iceSlotSplitter(iceSlots) {
	const newIceSlots = [];

	iceSlots.forEach((slot) => {
		const slotDurationHours = slot.endDateTime.diff(
			slot.startDateTime,
			"hours",
			true,
		);

		if (slotDurationHours === 2) {
			// Split the 2-hour slot into two 1-hour slots
			const midpoint = slot.startDateTime.clone().add(1, "hour");
			newIceSlots.push({
				arena: slot.arena,
				startDateTime: slot.startDateTime.clone(),
				endDateTime: midpoint.clone(),
			});
			newIceSlots.push({
				arena: slot.arena,
				startDateTime: midpoint.clone(),
				endDateTime: slot.endDateTime.clone(),
			});
		} else if (slotDurationHours > 1.5) {
			let startDateTime = slot.startDateTime.clone();
			let remainingDuration = slotDurationHours;

			while (remainingDuration >= 1) {
				let durationToAdd = Math.min(remainingDuration, 1.5); // Take either 1 hour or 1.5 hours
				let endDateTime = startDateTime.clone().add(durationToAdd, "hour");

				newIceSlots.push({
					arena: slot.arena,
					startDateTime: startDateTime.clone(),
					endDateTime: endDateTime.clone(),
				});

				startDateTime.add(durationToAdd, "hour");
				remainingDuration -= durationToAdd;
			}
		} else {
			// Push the original ice slot if its duration is less than or equal to 1.5 hours
			newIceSlots.push(slot);
		}
	});

	return newIceSlots;
}

function calculateIceValue(slot) {
	const slotDurationHours =
		slot.endDateTime.diff(slot.startDateTime, "minutes") / 60; // Duration in hours
	let iceValue = 0;

	// Add 0.5 to ice value for every 30 minutes of extended duration
	iceValue += Math.floor(slotDurationHours / 1.5) * 1.5; // Count full 1.5-hour increments
	iceValue += ((slotDurationHours % 1.5) / 0.5) * 0.5; // Add remaining duration in 30-minute increments

	return iceValue;
}

function getMetcalfeTeams(parsedGameSchedule) {
	const teamSet = new Set(); // Use a Set to store unique team names
	parsedGameSchedule.forEach((game) => {
		const homeTeam = game.homeTeam.includes("METCALFE JETS")
			? game.homeTeam.split("METCALFE JETS")[1].trim()
			: null;
		const awayTeam = game.awayTeam.includes("METCALFE JETS")
			? game.awayTeam.split("METCALFE JETS")[1].trim()
			: null;

		if (homeTeam) {
			const sanitizedTeam = sanitizeTeamName(homeTeam);
			teamSet.add(sanitizedTeam);
		}
		if (awayTeam) {
			const sanitizedTeam = sanitizeTeamName(awayTeam);
			teamSet.add(sanitizedTeam);
		}
	});

	metcalfeTeams = Array.from(teamSet); // Convert Set back to Array
}

function sanitizeTeamName(teamName) {
	// Remove the number in brackets (if present) and trim whitespace
	return teamName.replace(/\(\d+\)/g, '').trim();
}


// Schedule practices after ice slots and game schedule are available
async function schedulePractices() {
	// Fetch and process the game schedule
	let parsedGameSchedule = await UnifySchedules()
	// Extract Metcalfe Jets teams from the game schedule
	getMetcalfeTeams(parsedGameSchedule);

	// Sort available ice slots by start time
	let availableIceSlots = iceSlots.slice().sort((a, b) => a.startDateTime - b.startDateTime);

	// Initialize an object to track scheduled practices by slot
	const scheduledPracticesBySlot = {};

	// Initialize available slots with their respective ice values
	for (const slot of availableIceSlots) {
		scheduledPracticesBySlot[slot.startDateTime] = {
			slot,
			iceValue: calculateIceValue(slot), // Initially assuming no shared ice
			practices: [],
			teamsScheduled: 0, // Track the number of teams scheduled on this slot
			halfIce: false, // Track if the slot has half ice
		};
	}

	// Initialize teams' ice values
	const teamsIceValues = {};
	metcalfeTeams.forEach((team) => {
		teamsIceValues[team] = 0;
	});

	// Schedule practices for each Metcalfe Jets team
	for (const team of metcalfeTeams) {
		let scheduled = false;

		// Sort available ice slots by ice value
		const availableSlotsSortedByIceValue = Object.values(scheduledPracticesBySlot)
			.filter((slot) => slot.iceValue > 0 && slot.teamsScheduled < 2 && slot.practices.every((practice) => practice.team !== team)) // Filter out slots already scheduled for this team
			.sort((a, b) => b.iceValue - a.iceValue); // Sort in descending order of ice value

		// Find a suitable slot for the team
		for (const slotEntry of availableSlotsSortedByIceValue) {
			const slot = slotEntry.slot;

			// Check for black block conflicts
			const blackBlockConflict = blackBlocks.some((blackBlock) => {
				return (
					slot.startDateTime.isSameOrAfter(moment(blackBlock.startDate + ' ' + blackBlock.startTime)) &&
					slot.endDateTime.isSameOrBefore(moment(blackBlock.endDate + ' ' + blackBlock.endTime)) &&
					slot.arena === blackBlock.affectedTeam
				);
			});

			if (blackBlockConflict) {
				continue; // Skip this slot if there's a black block conflict
			}

			// Check for game conflicts
			const gameConflict = parsedGameSchedule.some((game) => {
				return (
					slot.startDateTime.isSame(moment(game.date), 'day') || // Check if practice date is the same as game date
					slot.endDateTime.isSame(moment(game.date), 'day')
				) && (game.homeTeam.includes(team) || game.awayTeam.includes(team));
			});

			if (!gameConflict) {
				const slotDurationHours = slot.endDateTime.diff(slot.startDateTime, 'hours', true);
				const practiceDuration = Math.min(Math.max(slotDurationHours, 1), 1.5); // Ensure practice duration is between 1 and 1.5 hours

				// Schedule the practice
				const practice = {
					team: `METCALFE JETS ${team}`,
					startDateTime: slot.startDateTime.clone(),
					endDateTime: slot.startDateTime.clone().add(practiceDuration, 'hours'),
				};

				// Update scheduled practices, teams' ice values, and the number of teams scheduled on this slot
				scheduledPracticesBySlot[slot.startDateTime].practices.push(practice);
				teamsIceValues[team] += practiceDuration;
				scheduledPracticesBySlot[slot.startDateTime].teamsScheduled++;
				if (scheduledPracticesBySlot[slot.startDateTime].teamsScheduled === 2) {
					slot.halfIce = true;
				}
				progress = progress + 25 / iceSlots.length;
				updateProgressBar();

				console.log(`Scheduled practice for ${practice.team} on ${practice.startDateTime} to ${practice.endDateTime}`);
				scheduled = true;
				break;
			}
		}

		if (!scheduled) {
			console.warn(`No suitable ice slot found for ${team}.`);
		}
	}

	// Convert scheduled practices to calendar events
	const scheduledPracticesArray = Object.values(scheduledPracticesBySlot).flatMap((entry) => entry.practices);
	console.log('Scheduled Practices:', scheduledPracticesArray);
	await convertToCalendarEvents(scheduledPracticesArray);
}



function displayEventDetails(details) {
	// Create a transparent overlay
	const overlay = document.createElement("div");
	overlay.classList.add("popup-overlay");
	document.body.appendChild(overlay);

	const popupContainer = document.createElement("div");
	popupContainer.classList.add("popup-container");

	const popupContent = document.createElement("div");
	popupContent.classList.add("popup-content");

	const content = document.createElement("p");
	content.textContent = details;

	const closeButton = document.createElement("span");
	closeButton.classList.add("close-button");
	closeButton.innerHTML = "&times;";
	closeButton.onclick = function() {
		popupContainer.remove();
		overlay.remove(); // Remove the overlay when the popup is closed
	};

	popupContent.appendChild(closeButton);
	popupContent.appendChild(content);
	popupContainer.appendChild(popupContent);

	// Apply solid white background to the popup container
	popupContainer.style.backgroundColor = "white";

	// Add styles to position the popup over the calendar
	popupContainer.style.position = "fixed";
	popupContainer.style.top = "50%";
	popupContainer.style.left = "50%";
	popupContainer.style.transform = "translate(-50%, -50%)";
	popupContainer.style.padding = "20px";
	popupContainer.style.borderRadius = "8px";
	popupContainer.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
	popupContainer.style.zIndex = "1000"; // Ensure the popup appears in front of other content

	document.body.appendChild(popupContainer);
}


let isCalendarReady = false;

let calendar;
document.addEventListener("DOMContentLoaded", function() {
	const calendarEl = document.getElementById("calendar");
	if (!calendarEl) {
		console.error("Calendar element not found in the DOM.");
		return;
	}

	calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: "dayGridMonth",
		headerToolbar: {
			left: "prev,next,today",
			center: "title",
			right: "timeGridDay,timeGridWeek,dayGridMonth",
		},
		// ... (other configurations)

		// Add the eventClick callback here
		eventClick: function(info) {
			const eventDetails = `
								Event Title: ${info.event.title}\n
								Start: ${info.event.start.toLocaleString()}\n
								End: ${info.event.end.toLocaleString()}
						`;
			displayEventDetails(eventDetails); // Function to display event details
		},
	});

	calendar.render(); // Make sure render() is called after initialization
	isCalendarReady = true; // Set the flag indicating calendar readiness
});

async function convertToCalendarEvents(practices) {
	// Wait for the calendar to be ready before adding events
	await waitForCalendarReady();

	const events = [];

	// Add game events
	const parsedGameSchedule = await UnifySchedules();
	parsedGameSchedule.forEach((game) => {
		if (
			game.homeTeam.includes("METCALFE JETS") ||
			game.awayTeam.includes("METCALFE JETS")
		) {
			events.push({
				title: `${game.homeTeam} vs ${game.awayTeam}`,
				start: moment(
					`${game.date} ${game.time}`,
					"YYYY-MM-DD HH:mm",
				).toISOString(),
				end: moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm")
					.add(1, "hours")
					.toISOString(), // Assuming game duration of 1 hour
				backgroundColor: "blue", // Example color for game events
			});
		}
	});

	// Add practice events
	practices.forEach((practice) => {
		// Modify the event title based on whether it's half-ice or full-ice
		const title =
			practice.team + (practice.halfIce ? " (Half Ice)" : " (Full Ice)");
		events.push({
			title: title,
			start: practice.startDateTime.toISOString(),
			end: practice.endDateTime.toISOString(),
			backgroundColor: "green",
		});
	});
	progress = 75;
	updateProgressBar();
	addEventsToCalendar(events);
}

function waitForCalendarReady() {
	return new Promise((resolve) => {
		const checkCalendar = () => {
			if (isCalendarReady) {
				resolve();
			} else {
				setTimeout(checkCalendar, 100); // Check again after a short delay
			}
		};
		checkCalendar();
	});
}

function addEventsToCalendar(events) {
	if (!calendar) {
		console.error("Calendar object is not available.");
		return;
	}
	console.log("Adding events to calendar:", events);
	for (let i = 0; i < events.length; i++) {
		if (i < 1) {
			console.log(events[i]);
			console.log("Events arrived!");
		}

		calendar.addEvent(events[i]);
	}
	progress = 99;
	updateProgressBar();
	calendar.render();
	progress = 100;
	updateProgressBar();
}

function handleBlackBlockSubmission(event) {
	event.preventDefault(); // Prevent the default form submission behavior

	const startDate = document.getElementById("startDate").value;
	const startTime = document.getElementById("startTime").value;
	const endDate = document.getElementById("endDate").value;
	const endTime = document.getElementById("endTime").value;
	const affectedTeam = document.getElementById("affectedTeam").value.toUpperCase();

	const blackBlockData = {
		startDate,
		startTime,
		endDate,
		endTime,
		affectedTeam
	};

	console.log("Adding Black Block:", blackBlockData)
	blackBlocks.push(blackBlockData);
}

function handleTeamSubmission(event) {
	event.preventDefault(); // Prevent the default form submission behavior

	const teamNameInput = document.getElementById("teamName").value.toUpperCase(); // Get the team name and convert to uppercase

	// Check if the team name is not empty
	if (teamNameInput.trim() !== "") {
		// Add the team to the list of Metcalfe teams if not already present
		if (!metcalfeTeams.includes(teamNameInput)) {
			metcalfeTeams.push(teamNameInput); // Add the team to the Metcalfe teams array
			console.log("Added team:", teamNameInput);
		} else {
			console.warn("Team already exists:", teamNameInput);
		}

		// Clear the team name input field
		document.getElementById("teamName").value = "";
	} else {
		console.error("Team name cannot be empty.");
	}
}

function updateProgressBar() {
	progressBar.value = progress;
	progressLabel.textContent = `${progress}%`;
}



// Entry point: Add event listeners or trigger functions as needed
document
	.getElementById("confirmButton")
	.addEventListener("click", handleIceSlotUpload);
document.getElementById("submitTeam").addEventListener("click", handleTeamSubmission);
document.getElementById("submitBlackBlock").addEventListener("click", handleBlackBlockSubmission);
