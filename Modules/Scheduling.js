import { parsedGameSchedulePromise } from './WebScraping.js';

parsedGameSchedulePromise.then(parsedGameSchedule => {
	console.log(parsedGameSchedule); // Use the parsedGameSchedule here
	console.log("Transfer successful");
	const gameSchedule = parsedGameSchedule;

	// Display available ice times
	displayAvailableIceTime(availableIceSlots);

	// Call the function with the game schedule data, available ice time slots, and teams
	schedulePracticesForTeams(gameSchedule, availableIceSlots, teams);
}).catch(error => {
	console.error('Error occurred while fetching data:', error);
});

// Define available ice time slots using ISO 8601 format
const availableIceSlots = [
		{ start: moment('2023-01-01T09:00'), end: moment('2023-01-01T10:30') }, // Slot 1
		{ start: moment('2023-01-01T11:00'), end: moment('2023-01-01T12:30') }, // Slot 2
		// Add more slots as needed
];

// Sample team data (array of objects)
const teams = [
		{ name: 'Team A', practiceDurationOptions: [1, 1.5] },
		{ name: 'Team B', practiceDurationOptions: [1, 1.5] },
		{ name: 'Team C', practiceDurationOptions: [1.5, 1] },
		// ... More teams
];

// Function to display available ice times
function displayAvailableIceTime(iceTimeSlots) {
		console.log('Available Ice Time Slots:');
		iceTimeSlots.forEach((slot, index) => {
				console.log(`Slot ${index + 1}: ${slot.start.format('YYYY-MM-DD HH:mm')} to ${slot.end.format('YYYY-MM-DD HH:mm')}`);
		});
}

// Function to schedule practices for multiple teams
function schedulePracticesForTeams(gameSchedule, iceTimeSlots, teams) {
	for (let team of teams) {
		console.log(`Scheduling practices for ${team.name}:`);
		for (let i = 0; i < gameSchedule.length - 1; i++) {
			const currentGame = gameSchedule[i];
			const nextGame = gameSchedule[i + 1];

			// Calculate time gap between current game and next game using moment.js
			const currentGameTime = moment(currentGame.date + ' ' + currentGame.time);
			const nextGameTime = moment(nextGame.date + ' ' + nextGame.time);
			const timeGapHours = moment.duration(nextGameTime.diff(currentGameTime)).asHours();

			// Check if a practice can fit within the time gap and within available ice time slots for the current team
			for (let duration of team.practiceDurationOptions) {
				for (let slot of iceTimeSlots) {
					if (timeGapHours >= duration) {
						// Calculate practice start time based on game schedule
						const practiceStartTime = moment(currentGameTime).add(30, 'minutes'); // For example, starting 30 minutes after game ends

						// Check if practice time falls within available ice time slot
						if (
							practiceStartTime.isSameOrAfter(slot.start) &&
							practiceStartTime.add(duration, 'hours').isSameOrBefore(slot.end)
						) {
							console.log(
								`Practice for ${team.name} can be scheduled between ${currentGame.date} and ${nextGame.date} starting at ${practiceStartTime.format(
									'YYYY-MM-DD HH:mm'
								)} for ${duration} hours in slot from ${slot.start.format('HH:mm')} to ${slot.end.format('HH:mm')}.`
							);
							// Here, you can store or output the scheduled practice details for the team
						}
					}
				}
			}
		}
	}
}

