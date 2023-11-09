let teams;
let AvailableTimes = ['8:00 AM', '10:00 AM', '2:00 PM'];
let schedule = {};


function createSchedule() {
	for (let i = 0; i < teams.length; i++) {
		schedule[teams[i]] = AvailableTimes[i];
	}

	console.log(schedule);
}
