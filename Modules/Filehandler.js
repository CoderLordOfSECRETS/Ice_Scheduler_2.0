// @deno-types="https://cdn.sheetjs.com/xlsx-0.20.0/package/types/index.d.ts"
import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs';

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
	let workbook = XLSX.read(data, { type: 'array' });
	let worksheet = workbook.Sheets[workbook.SheetNames[0]];
	let jsonData = XLSX.utils.sheet_to_json(worksheet);
	return jsonData;
}






export { handleUpload, convertToJSON };