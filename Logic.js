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
	const lines = content.split("\n").slice(1); // Remove header line

	const iceSlots = lines.map((line) => {
		const [arena, date, startTime, endTime] = line.split(",");

		// Combine date and time strings into a single datetime using moment.js
		const startDateTime = moment(
			`${date.trim()} ${startTime.trim()}`,
			"YYYY-MM-DD HH:mm",
		);
		const endDateTime = moment(
			`${date.trim()} ${endTime.trim()}`,
			"YYYY-MM-DD HH:mm",
		);

		return {
			arena: arena.trim(),
			startDateTime,
			endDateTime,
		};
	});

	return iceSlots;
}

// Schedule practices after ice slots and game schedule are available
async function schedulePractices() {
	if (iceSlots.length === 0) {
		console.error("No ice slots available.");
		return;
	}

	const parsedGameSchedule = await fetchAndProcessGameSchedule();

	const availableIceSlots = iceSlots.slice(); // Create a copy of iceSlots array

	const scheduledPracticesBySlot = {};

	for (const slot of availableIceSlots) {
		scheduledPracticesBySlot[slot.startDateTime] = []; // Initialize slots to store practices
	}

	const teamsScheduled = {}; // Track teams already assigned to ice slots

	parsedGameSchedule.forEach((game) => {
		const homeTeam = game.homeTeam;
		const awayTeam = game.awayTeam;

		let selectedTeam = null;

		if (homeTeam.includes("METCALFE JETS")) {
			const team = homeTeam.split("METCALFE JETS")[1].trim();
			if (!teamsScheduled[team]) {
				selectedTeam = team;
			}
		}

		if (!selectedTeam && awayTeam.includes("METCALFE JETS")) {
			const team = awayTeam.split("METCALFE JETS")[1].trim();
			if (!teamsScheduled[team]) {
				selectedTeam = team;
			}
		}

		if (selectedTeam) {
			const teamsPracticesCount = {};
			for (const team in teamsScheduled) {
				teamsPracticesCount[team] = scheduledPracticesBySlot.length;
			}

			const sortedTeams = Object.keys(teamsPracticesCount).sort(
				(teamA, teamB) => teamsPracticesCount[teamA] - teamsPracticesCount[teamB]
			);

			const selectedSlot = availableIceSlots.find((slot) => {
				const gameDateTime = moment(
					`${game.date} ${game.time}`,
					"YYYY-MM-DD HH:mm",
				);
				return (
					gameDateTime.isSameOrAfter(slot.startDateTime) &&
					gameDateTime.isSameOrBefore(slot.endDateTime) &&
					scheduledPracticesBySlot[slot.startDateTime].length === 0
				);
			});

			if (selectedSlot) {
				scheduledPracticesBySlot[selectedSlot.startDateTime].push({
					team: `METCALFE JETS ${selectedTeam}`,
					startDateTime: selectedSlot.startDateTime.clone(),
					endDateTime: selectedSlot.startDateTime.clone().add(1, "hours"),
				});
				teamsScheduled[selectedTeam] = true; // Mark the team as scheduled
			}
		}
	});

	const scheduledPractices = {};
	for (const slot in scheduledPracticesBySlot) {
		scheduledPractices[slot] = scheduledPracticesBySlot[slot];
	}

	console.log("Scheduled Practices:", scheduledPractices);
	convertToCalendarEvents(scheduledPractices);
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
		events.push({
			title: `${game.homeTeam} vs ${game.awayTeam}`,
			start: moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm").toISOString(),
			end: moment(`${game.date} ${game.time}`, "YYYY-MM-DD HH:mm").add(1, 'hours').toISOString(), // Assuming game duration of 1 hours
			backgroundColor: 'blue', // Example color for game events
		});
	});
	console.log("Games done")
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
