const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
	cors: { origin: "*", methods: ["GET", "POST"] },
	// Настройка самого сокета на низкую задержку
	pingInterval: 2000,
	pingTimeout: 5000,
});

// --- КОНФИГ ИГРЫ ---
const TICK_RATE = 20; // 20 обновлений в секунду (стандарт для веб-игр)
const HEARTBEAT_TIMEOUT = 3000; // 3 сек без сигнала = Offline
const RECONNECT_WINDOW = 1000; // Если сигнал был менее 1 сек назад — это точно дубликат вкладки

let gameState = {
	hostSocketId: null,
	status: 'waiting', // 'waiting' | 'playing'
	// Храним игроков как объект для быстрого доступа по userId
	players: {}
	/* Структура игрока в players:
		 [userId]: {
				socketId: "...",
				name: "...",
				avatar: "...",
				score: 0,
				isOnline: true,
				lastHeartbeat: timestamp
				ping: 0
		 }
	*/
};

const HOST_PASSWORD = "SECRET_TASK_PASS";

// --- GAME LOOP (СЕРДЦЕ СЕРВЕРА) ---
setInterval(() => {
	const now = Date.now();
	const playerList = Object.values(gameState.players);
	let hasChanges = false;

	// 1. Проверяем здоровье игроков
	playerList.forEach(player => {
		// Если игрок был онлайн, но замолчал
		if (player.isOnline && (now - player.lastHeartbeat > HEARTBEAT_TIMEOUT)) {
			console.log(`💀 Игрок отвалился (Timeout): ${player.name}`);
			player.isOnline = false;
			hasChanges = true;
		}
	});

	// 2. Отправляем состояние ХОСТУ (Тик)
	if (gameState.hostSocketId) {
		// Оптимизация: шлем массив только для рендера
		io.to(gameState.hostSocketId).emit('game_tick', {
			players: playerList, // Отправляем массив
			status: gameState.status
		});
	}

}, 1000 / TICK_RATE);


io.on('connection', (socket) => {
	// --- ХОСТ ---
	socket.on('host_login', (password) => {
		// Проверка IP (оставляем твою защиту)
		const clientIp = socket.handshake.address;
		const isLocal = clientIp === '::1' || clientIp === '127.0.0.1' || clientIp === '::ffff:127.0.0.1';

		if (!isLocal) {
			socket.emit('host_error', 'Access denied');
			return;
		}

		if (password === HOST_PASSWORD) {
			gameState.hostSocketId = socket.id;
			console.log(`✅ ХОСТ ПОДКЛЮЧЕН: ${socket.id}`);
		}
	});

	socket.on('host_start_game', () => {
		if (socket.id === gameState.hostSocketId) {
			gameState.status = 'playing';
			console.log('🚂 ИГРА НАЧАЛАСЬ');
		}
	});

	// --- ИГРОК: ВХОД (HANDSHAKE) ---
	socket.on('player_handshake', (data) => {
		const { name, userId, avatar } = data;
		const now = Date.now();

		let player = gameState.players[userId];

		// 1. АНТИ-ТВИНК (Жесткий)
		// Если игрок существует И подавал признаки жизни менее секунды назад
		// И при этом ломится с другого сокета
		if (player && player.isOnline && (now - player.lastHeartbeat < RECONNECT_WINDOW) && player.socketId !== socket.id) {
			console.log(`⛔ Анти-твинк: ${name} пытается открыть вторую вкладку.`);
			socket.emit('handshake_error', 'Вторая вкладка запрещена! 🚫');
			return;
		}

		// 2. ПОЕЗД УЕХАЛ
		if (gameState.status === 'playing' && !player) {
			socket.emit('handshake_error', 'Игра уже идет! 🚂');
			return;
		}

		if (player) {
			// === РЕКОННЕКТ ===
			player.socketId = socket.id;
			player.isOnline = true;
			player.lastHeartbeat = now;
			// Имя обновляем ТОЛЬКО если игра не идет
			if (gameState.status === 'waiting' && name) player.name = name;

			console.log(`🔄 Реконнект: ${player.name}`);
			socket.emit('handshake_success', player);
		} else {
			// === НОВЫЙ ===
			player = {
				userId,
				socketId: socket.id,
				name: name || `Игрок`,
				avatar: avatar || '😎',
				score: 0,
				isOnline: true,
				lastHeartbeat: now
			};
			gameState.players[userId] = player;
			console.log(`👋 Новый: ${player.name}`);
			socket.emit('handshake_success', player);
		}
	});

	// --- ИГРОК: HEARTBEAT (ПУЛЬС) ---
	// Игрок должен слать это постоянно
	socket.on('heartbeat', (data, callback) => {
		// data может содержать { ping: number }
		const player = Object.values(gameState.players).find(p => p.socketId === socket.id);

		if (player) {
			player.lastHeartbeat = Date.now();
			player.isOnline = true;

			// Сохраняем пинг, который нам прислал клиент (для отображения на Хосте)
			if (data && typeof data.ping === 'number') {
				player.ping = data.ping;
			}

			// ОТВЕЧАЕМ КЛИЕНТУ (ACK), чтобы он мог замерить время
			if (callback) callback();

		} else {
			socket.emit('force_reconnect');
		}
	});

	// Обычный дисконнект нам теперь почти не важен, но для логов оставим
	socket.on('disconnect', () => {
		if (socket.id === gameState.hostSocketId) {
			console.log('🔌 Хост отключился');
			gameState.hostSocketId = null;
		}
	});
});

const PORT = 3001;
server.listen(PORT, () => {
	console.log(`🚀 REAL-TIME SERVER ON ${PORT} (Tick: ${TICK_RATE}Hz)`);
});