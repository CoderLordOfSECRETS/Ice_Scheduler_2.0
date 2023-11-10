import { handleUpload } from './Modules/Filehandler.js';

document.getElementById('uploadTeamsBtn').addEventListener('click', () => {
    handleUpload('teams');
});

document.getElementById('uploadGamesBtn').addEventListener('click', () => {
    handleUpload('games');
});
