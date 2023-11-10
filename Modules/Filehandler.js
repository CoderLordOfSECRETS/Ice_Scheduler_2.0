import * as XLSX from 'https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.full.min.js';

function handleUpload(type) {
		const fileInput = document.getElementById(type + "Spreadsheet");
		const file = fileInput.files[0];
		const reader = new FileReader();

		reader.onload = function(e) {
				const contents = e.target.result;
				const jsonData = XLSX.convertToJSON(contents);
				// Do something with the JSON data
		};

		reader.readAsBinaryString(file);
}

function convertToJSON(contents) {
		// Your implementation to convert file contents to JSON
}

export { handleUpload, convertToJSON };
