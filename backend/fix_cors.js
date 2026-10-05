import fs from 'fs';
let code = fs.readFileSync('D:/Tutorials/trade-journal/backend/server.js', 'utf8');
code = code.replace('\"https://forexnotes.in\",\n      \"\",', '\"https://forexnotes.in\",\n      \"capacitor://localhost\",\n      \"http://localhost\",\n      \"\",');
code = code.replace('\"https://forexnotes.in\",\r\n      \"\",', '\"https://forexnotes.in\",\r\n      \"capacitor://localhost\",\r\n      \"http://localhost\",\r\n      \"\",');
fs.writeFileSync('D:/Tutorials/trade-journal/backend/server.js', code);
console.log('Fixed CORS');
