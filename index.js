

const express = require('express');
const http = require('http');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const server = http.createServer(app);

// Socket.IO server
const io = require('./socketIoServer/socketIoServer')
io.attach(server)

app.use(bodyParser.json())

// Serve the 'index.html' file when accessing the root path
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/network', 'index.html'));
});

app.post('/connect', (req, res) => {
    const { ssid, password } = req.body;
    console.log(`Connecting to WiFi network "${ssid}"...`);
    exec(`sudo nmcli device wifi connect ${ssid} password ${password}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            res.status(500).json({ error: `Error: ${error.message}` });
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            res.status(500).json({ error: `stderr: ${stderr}` });
            return;
        }
        console.log(`stdout: ${stdout}`);
        res.status(200).json({ message: 'WiFi connected successfully.' });
    });
});

server.listen(3000);



