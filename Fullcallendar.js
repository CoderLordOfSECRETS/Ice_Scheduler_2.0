document.addEventListener('DOMContentLoaded', function() {
	const calendarEl = document.getElementById('calendar');
	const calendar = new calendar.Calendar(calendarEl, {
		initialView: 'dayGridMonth',
		events: convertToCalendarEvents(scheduledPractices),
	});
	calendar.render();
});

function convertToCalendarEvents(scheduledPractices) {
	const events = [];
	for (const team in scheduledPractices) {
		scheduledPractices[team].forEach(practice => {
			events.push({
				title: `${practice.team} Practice`,
				start: practice.startDateTime.toISOString(), // Convert to ISO format
				end: practice.endDateTime.toISOString(), // Convert to ISO format
			});
		});
	}
	return events;
}