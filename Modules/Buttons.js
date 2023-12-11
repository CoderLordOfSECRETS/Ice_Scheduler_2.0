// Function to handle file upload and process the content
let iceSlots
function handleIceSlotUpload() {
	const fileInput = document.getElementById('iceSlotInput');
	const file = fileInput.files[0];

	if (file) {
		const reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function (event) {
			const content = event.target.result;
			iceSlots = parseIceSlotData(content);
			if (iceSlots.length > 0) {
				console.log('Uploaded Ice Slots:', iceSlots);
				
			} else {
				console.error('No ice slots found in the uploaded file.');
			}
		};
	} else {
		console.error('No file selected.');
	}
}

// Function to parse uploaded ice slot data (you might need to customize this based on your file format)
function parseIceSlotData(content) {
	// This might involve CSV parsing or processing other formats
	// Return the extracted ice slot data as an array of objects

	// Example:
	// For CSV parsing (replace this with your specific parsing logic):
	const lines = content.split('\n');
	const iceSlots = lines.map(line => {
		const [start, end] = line.split(',').map(entry => moment(entry.trim(), 'YYYY-MM-DD HH:mm'));
		return { start, end };
	});
	return iceSlots;
}

export const practiceslots = iceSlots;
export function handleIceSlotUpload()