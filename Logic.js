// Define a function that fetches and processes the game schedule data
async function fetchAndProcessGameSchedule() {
	try {
		const response = await fetch('https://ttmwebservices.ca/schedules/index.php?pgid=dnl-11-010&dtype=CSV&AID=HEO&JID=district9&pcode=15679761017023700001&ddtype=&stype=2&atype=');
		if (!response.ok) {
			throw new Error('Network response was not ok.');
		}
		const csvData = await response.text();
		const lines = csvData.split('\n').slice(1);

		function parseGameScheduleLine(line) {
			const [
				division,
				gameId,
				date,
				time,
				venue,
				homeTeam,
				awayTeam,
				gameStatus // New field added for Game Status
			] = line.split('","').map(entry => entry.replace(/"/g, ''));

			return {
				division,
				gameId,
				date,
				time,
				venue,
				homeTeam,
				awayTeam,
				gameStatus // Include the new field in the returned object
			};
		}


		const parsedGameSchedule = lines.map(parseGameScheduleLine);
		return parsedGameSchedule;
	} catch (error) {
		console.error('There was a problem fetching the schedule:', error);
		alert('There was a problem fetching the schedule. Please try again.'); // Inform the user about the error
		return []; // Return empty array or handle the error case
	}
}

// Handle ice slot upload and process content
let iceSlots = [];
function handleIceSlotUpload() {
	const fileInput = document.getElementById('iceSlotInput');
	const file = fileInput.files[0];

	if (file) {
		const reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(event) {
			const content = event.target.result;
			iceSlots = parseIceSlotData(content);
			if (iceSlots.length > 0) {
				console.log('Uploaded Ice Slots:', iceSlots);
				schedulePractices(); // Trigger scheduling after ice slots upload
			} else {
				console.error('No ice slots found in the uploaded file.');
			}
		};
	} else {
		console.error('No file selected.');
	}
}

// Parse ice slot data
function parseIceSlotData(content) {
	const lines = content.split('\n').slice(1); // Remove header line

	const iceSlots = lines.map(line => {
		const [arena, date, startTime, endTime] = line.split(',');

		// Combine date and time strings into a single datetime using moment.js
		const startDateTime = moment(`${date.trim()} ${startTime.trim()}`, 'YYYY-MM-DD HH:mm');
		const endDateTime = moment(`${date.trim()} ${endTime.trim()}`, 'YYYY-MM-DD HH:mm');

		return {
			arena: arena.trim(),
			startDateTime,
			endDateTime
		};
	});

	return iceSlots;
}

// Schedule practices after ice slots and game schedule are available
async function schedulePractices() {
	if (iceSlots.length === 0) {
		console.error('No ice slots available.'); // Provide feedback if ice slots are missing
		return; // Exit if no ice slots are available
	}

	const parsedGameSchedule = await fetchAndProcessGameSchedule();

	// Group Metcalfe Jets games by team
	const metcalfeJetsGamesByTeam = {};
	parsedGameSchedule.forEach(game => {
		const homeTeam = game.homeTeam;
		const awayTeam = game.awayTeam;

		if (homeTeam.includes('METCALFE JETS')) {
			const team = homeTeam.split('METCALFE JETS')[1].trim();
			metcalfeJetsGamesByTeam[team] = metcalfeJetsGamesByTeam[team] || [];
			metcalfeJetsGamesByTeam[team].push(game);
		}

		if (awayTeam.includes('METCALFE JETS')) {
			const team = awayTeam.split('METCALFE JETS')[1].trim();
			metcalfeJetsGamesByTeam[team] = metcalfeJetsGamesByTeam[team] || [];
			metcalfeJetsGamesByTeam[team].push(game);
		}
	});

	// Schedule practices for each Metcalfe Jets team
	const scheduledPractices = {};
	for (const team in metcalfeJetsGamesByTeam) {
		const teamGames = metcalfeJetsGamesByTeam[team];
		const availableIceSlots = iceSlots.filter(slot => {
			const conflictingGame = teamGames.find(game => {
				const gameDateTime = moment(`${game.date} ${game.time}`, 'YYYY-MM-DD HH:mm');
				return gameDateTime.isSameOrAfter(slot.startDateTime) && gameDateTime.isSameOrBefore(slot.endDateTime);
			});
			return !conflictingGame;
		});

		const scheduledPracticesForTeam = [];
		for (const slot of availableIceSlots) {
			const slotDuration = slot.endDateTime.diff(slot.startDateTime, 'hours', true);
			if (slotDuration >= 0.5 && slotDuration <= 1.5) {
				scheduledPracticesForTeam.push({
					team: `METCALFE JETS ${team}`,
					startDateTime: slot.startDateTime.clone(),
					endDateTime: slot.startDateTime.clone().add(1, 'hours') // Assuming 1 hour duration for practice
				});
			}
		}

		scheduledPractices[team] = scheduledPracticesForTeam;
	}

	console.log('Scheduled Practices:', scheduledPractices);
	// You can perform further operations with scheduledPractices here

}

// Entry point: Add event listeners or trigger functions as needed
document.getElementById('uploadTeamsBtn').addEventListener('click', handleIceSlotUpload);
// Add other event listeners or triggers as needed
