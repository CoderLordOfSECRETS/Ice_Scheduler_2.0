let teams;
let AvailableTimes = ['8:00 AM', '10:00 AM', '2:00 PM'];

let schedule = {};

function handleUpload() {
	const fileInput = document.getElementById("teamsSpreadsheet");
	const file = fileInput.files[0];
	const reader = new FileReader();

	reader.onload = function(e) {
		const contents = e.target.result;
		const jsonData = convertToJSON(contents);
		teams = jsonData;
		createSchedule();
	};

	reader.readAsBinaryString(file);
}

function convertToJSON(contents) {
	const data = new Uint8Array(contents);
	let workbook = XLSX.read(data, {type:'array'});
	let worksheet = workbook.Sheets[workbook.SheetNames[0]];
	let jsonData = XLSX.utils.sheet_to_json(worksheet);
	return jsonData;
}

function createSchedule() {
	for (let i = 0; i < teams.length; i++) {
		schedule[teams[i]] = AvailableTimes[i];
	}

	console.log(schedule);
}
