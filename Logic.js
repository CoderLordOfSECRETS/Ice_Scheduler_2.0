// Define a function that fetches and processes the game schedule data
let scheduledPractices
async function fetchAndProcessGameSchedule() {
	try {
		const response = await fetch(
			"https://ttmwebservices.ca/schedules/index.php?pgid=dnl-11-010&dtype=CSV&AID=HEO&JID=district9&pcode=15679761017023700001&ddtype=&stype=2&atype=",
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
				homeTeam,
				awayTeam,
				gameStatus, // Include the new field in the returned object
			};
		}

		const parsedGameSchedule = lines.map(parseGameScheduleLine).filter((game) => game !== null); // Filter out null (undefined or incomplete data)

		return parsedGameSchedule;
	} catch (error) {
		console.error("There was a problem fetching the schedule:", error);
		alert("There was a problem fetching the schedule. Please try again."); // Inform the user about the error
		return []; // Return empty array or handle the error case
	}
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

		const iceSlots = lines.map((line, index) => {
			const [arena, dateString, startTime, endTime] = line.split(",");

			if (!arena || !dateString || !startTime || !endTime) {
				console.error(`Skipped invalid ice slot data at line ${index + 2}: Incomplete data.`);
				return null;
			}

			const dateFormats = [
				"YYYY-MM-DD", // Format 1
				"MM/DD/YYYY", // Format 2
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
					`${dateFormats[formatIndex]} HH:mm`
				);
				endDateTime = moment(
					`${dateString.trim()} ${endTime.trim()}`,
					`${dateFormats[formatIndex]} HH:mm`
				);
				formatIndex++;
			}

			if (!startDateTime || !startDateTime.isValid() || !endDateTime || !endDateTime.isValid()) {
				console.error(`Skipped invalid ice slot data at line ${index + 2}: Invalid date or time format.`);
				return null;
			}

			if (endDateTime.isBefore(startDateTime)) {
				console.error(`Skipped invalid ice slot data at line ${index + 2}: End time is before start time.`);
				return null;
			}

			return {
				arena: arena.trim(),
				startDateTime,
				endDateTime,
			};
		}).filter(slot => slot !== null); // Remove null entries

		return iceSlots;
	} catch (error) {
		console.error("Error parsing ice slots:", error.message);
		return [];
	}
}

function calculateIceValue(slot) {
	const slotDuration = slot.endDateTime.diff(slot.startDateTime, 'hours', true);

	if (slotDuration >= 1.5) {
		// Full ice, 90 minutes
		return 1.5;
	} else if (slotDuration >= 1) {
		// Full ice, 60 minutes
		return 1;
	} else if (slotDuration >= 0.75) {
		// Half ice, 90 minutes
		return 0.75;
	} else {
		// Half ice, 60 minutes or other cases
		return 0.5;
	}
}

// Schedule practices after ice slots and game schedule are available
// Schedule practices after ice slots and game schedule are available
async function schedulePractices() {
	if (iceSlots.length === 0) {
		console.error("No ice slots available.");
		return;
	}

	const parsedGameSchedule = await fetchAndProcessGameSchedule();

	const availableIceSlots = iceSlots.slice(); // Create a copy of iceSlots array

	const scheduledPracticesBySlot = {};

	// Initialize available slots with their respective ice values
	for (const slot of availableIceSlots) {
		scheduledPracticesBySlot[slot.startDateTime] = {
			iceValue: calculateIceValue(slot),
			practices: [],
		};
	}

	const teamsScheduled = {}; // Track teams already assigned to ice slots

	// Sort teams by the number of practices scheduled
	const teamsByPracticeCount = {};
	parsedGameSchedule.forEach((game) => {
		const homeTeam = game.homeTeam.includes("METCALFE JETS") ? game.homeTeam.split("METCALFE JETS")[1].trim() : null;
		const awayTeam = game.awayTeam.includes("METCALFE JETS") ? game.awayTeam.split("METCALFE JETS")[1].trim() : null;

		if (homeTeam && !teamsByPracticeCount[homeTeam]) {
			teamsByPracticeCount[homeTeam] = 0;
		}
		if (awayTeam && !teamsByPracticeCount[awayTeam]) {
			teamsByPracticeCount[awayTeam] = 0;
		}
	});

	// Iterate through games and assign practices based on ice value and team practice count
	parsedGameSchedule.forEach((game) => {
		const homeTeam = game.homeTeam.includes("METCALFE JETS") ? game.homeTeam.split("METCALFE JETS")[1].trim() : null;
		const awayTeam = game.awayTeam.includes("METCALFE JETS") ? game.awayTeam.split("METCALFE JETS")[1].trim() : null;

		let selectedTeam = null;

		if (homeTeam && !teamsScheduled[homeTeam]) {
			if (!selectedTeam || teamsByPracticeCount[selectedTeam] > teamsByPracticeCount[homeTeam]) {
				selectedTeam = homeTeam;
			}
		}

		if (awayTeam && !teamsScheduled[awayTeam]) {
			if (!selectedTeam || teamsByPracticeCount[selectedTeam] > teamsByPracticeCount[awayTeam]) {
				selectedTeam = awayTeam;
			}
		}

		if (selectedTeam) {
			const selectedSlot = availableIceSlots.find((slot) => {
				const { remainingIce, practices } = scheduledPracticesBySlot[slot.startDateTime];

				const gameDateTime = moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm");

				const isSlotAvailable = practices.every(practice => {
					return (
						gameDateTime.isSameOrAfter(practice.startDateTime) &&
						gameDateTime.isSameOrBefore(practice.endDateTime)
					);
				});

				const slotDuration = slot.endDateTime.diff(slot.startDateTime, 'hours', true);
				const practiceDuration = slotDuration >= 1.5 ? 1.5 : 1;

				return remainingIce >= practiceDuration && isSlotAvailable;
			});

			if (selectedSlot) {
				const { iceValue } = scheduledPracticesBySlot[selectedSlot.startDateTime];
				const slotDuration = selectedSlot.endDateTime.diff(selectedSlot.startDateTime, 'hours', true);
				const practiceDuration = slotDuration >= 1.5 ? 1.5 : 1;
				const iceUsed = practiceDuration === 1.5 ? 2 : 1;

				scheduledPracticesBySlot[selectedSlot.startDateTime].practices.push({
					team: `METCALFE JETS ${selectedTeam}`,
					startDateTime: selectedSlot.startDateTime.clone(),
					endDateTime: selectedSlot.startDateTime.clone().add(practiceDuration, 'hours'),
				});

				scheduledPracticesBySlot[selectedSlot.startDateTime].iceValue -= iceUsed;
				teamsScheduled[selectedTeam] = true;
				teamsByPracticeCount[selectedTeam]++;
			}
		}
	});
}



document.addEventListener("DOMContentLoaded", function() {
	const calendarEl = document.getElementById("calendar");
	if (!calendarEl) {
		console.error("Calendar element not found in the DOM.");
		return;
	}

	const calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: "dayGridMonth",

		views: {
			timeGridFourDay: {
				type: 'timeGrid',
				duration: { days: 4 }
			}
		}
	});

	calendar.render();
});

function displayEventDetails(details) {
	const popupContainer = document.createElement('div');
	popupContainer.classList.add('popup-container');

	const popupContent = document.createElement('div');
	popupContent.classList.add('popup-content');

	const content = document.createElement('p');
	content.textContent = details;

	const closeButton = document.createElement('span');
	closeButton.classList.add('close-button');
	closeButton.innerHTML = '&times;';
	closeButton.onclick = function() {
		popupContainer.remove();
	};

	popupContent.appendChild(closeButton);
	popupContent.appendChild(content);
	popupContainer.appendChild(popupContent);

	document.body.appendChild(popupContainer);
}


let isCalendarReady = false;

let calendar
document.addEventListener("DOMContentLoaded", function() {
	const calendarEl = document.getElementById("calendar");
	if (!calendarEl) {
		console.error("Calendar element not found in the DOM.");
		return;
	}

	calendar = new FullCalendar.Calendar(calendarEl, {
		initialView: "dayGridMonth",
		headerToolbar: {
			left: 'prev,next,today',
			center: 'title',
			right: 'timeGridDay,timeGridWeek,dayGridMonth'
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
		}
	});

	calendar.render(); // Make sure render() is called after initialization
	isCalendarReady = true; // Set the flag indicating calendar readiness
});


async function convertToCalendarEvents(practices) {
	// Wait for the calendar to be ready before adding events
	await waitForCalendarReady();

	const events = [];

	// Add game events
	const parsedGameSchedule = await fetchAndProcessGameSchedule();
	parsedGameSchedule.forEach((game) => {
		if (
			game.homeTeam.includes("METCALFE JETS") ||
			game.awayTeam.includes("METCALFE JETS")
		) {
			events.push({
				title: `${game.homeTeam} vs ${game.awayTeam}`,
				start: moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm").toISOString(),
				end: moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm").add(1, 'hours').toISOString(), // Assuming game duration of 1 hour
				backgroundColor: 'blue', // Example color for game events
			});
		}
	});

	// Add practice events
	for (const team in practices) {
		practices[team].forEach((practice) => {
			events.push({
				title: `${practice.team} Practice`,
				start: practice.startDateTime.toISOString(),
				end: practice.endDateTime.toISOString(),
				backgroundColor: 'green', // Example color for practice events
			});
		});
	}

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
		console.error('Calendar object is not available.');
		return;
	}
	console.log("Adding events to calendar:", events);
	for (let i = 0; i < events.length; i++) {
		if (i < 1) {
			console.log(events[i])
			console.log("Events arrived!")
		}

		calendar.addEvent(events[i]);

	}
	calendar.render();
}

// Entry point: Add event listeners or trigger functions as needed
document.getElementById("confirmButton").addEventListener("click", handleIceSlotUpload);

// Other event listeners or triggers as needed
