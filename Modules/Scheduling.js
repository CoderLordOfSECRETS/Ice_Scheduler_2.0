import { convertToJSON } from './Modules/Filehandler.js';

function getTeamsSpreadsheetElement() {
  return document.getElementById("teamsSpreadsheet");
}
// Assuming you have a function to fetch file contents, you can use it like this:
const fileContents = getTeamsSpreadsheetElement();
const jsonData = convertToJSON(fileContents);
console.log(jsonData);