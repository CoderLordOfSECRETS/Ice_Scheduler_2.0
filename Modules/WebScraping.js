// Define a function that fetches and processes the data
async function fetchData() {
	try {
		const response = await fetch('https://ttmwebservices.ca/schedules/index.php?pgid=dnl-11-010&dtype=CSV&AID=HEO&JID=district9&pcode=15679761017023700001&ddtype=&stype=0&atype=');
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
				awayTeam
			] = line.split('","').map(entry => entry.replace(/"/g, ''));

			return {
				division,
				gameId,
				date,
				time,
				venue,
				homeTeam,
				awayTeam
			};
		}

		const parsedGameSchedule = lines.map(parseGameScheduleLine);
		return parsedGameSchedule;
	} catch (error) {
		console.error('There was a problem fetching the schedule:', error);
		return []; // Return empty array or handle the error case
	}
}


// Export a Promise that resolves to the parsed data
export const parsedGameSchedulePromise = fetchData();
