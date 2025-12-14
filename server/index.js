const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Настройка Socket.io с CORS
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173", // Адрес твоего Vite-фронтенда
		methods: ["GET", "POST"]
	}
});

io.on('connection', (socket) => {
	console.log('Пользователь подключился:', socket.id);

	socket.on('disconnect', () => {
		console.log('Пользователь отключился:', socket.id);
	});
});

const PORT = 3001;
server.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`);
});