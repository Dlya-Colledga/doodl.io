const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
	cors: { origin: "*", methods: ["GET", "POST"] },
	pingInterval: 2000,
	pingTimeout: 5000,
});

const TICK_RATE = 20;
const HEARTBEAT_TIMEOUT = 3000;
const RECONNECT_WINDOW = 1000;

let gameState = {
	hostSocketId: null,
	status: "waiting",
	players: {}
};

const HOST_PASSWORD = "SECRET_TASK_PASS";

setInterval(() => {
	const now = Date.now();
	const playerList = Object.values(gameState.players);
	let hasChanges = false;

	playerList.forEach(player => {
		if (player.isOnline && (now - player.lastHeartbeat > HEARTBEAT_TIMEOUT)) {
			console.log(`💀 Игрок отвалился (Timeout): ${player.name}`);
			player.isOnline = false;
			hasChanges = true;
		}
	});

	if (gameState.hostSocketId) {
		io.to(gameState.hostSocketId).emit("game_tick", {
			players: playerList,
			status: gameState.status
		});
	}

}, 1000 / TICK_RATE);


io.on("connection", (socket) => {
	socket.on("host_login", (password) => {
		const clientIp = socket.handshake.address;
		const isLocal = clientIp === "::1" || clientIp === "127.0.0.1" || clientIp === "::ffff:127.0.0.1";

		if (!isLocal) {
			socket.emit("host_error", "Access denied");
			return;
		}

		if (password === HOST_PASSWORD) {
			gameState.hostSocketId = socket.id;
			console.log(`✅ ХОСТ ПОДКЛЮЧЕН: ${socket.id}`);
		}
	});

	socket.on("host_start_game", () => {
		if (socket.id === gameState.hostSocketId) {
			gameState.status = "playing";
			console.log("🚂 ИГРА НАЧАЛАСЬ");
		}
	});

	socket.on("player_handshake", (data) => {
		const { name, userId, avatar } = data;
		const now = Date.now();

		let player = gameState.players[userId];

		if (player && player.isOnline && (now - player.lastHeartbeat < RECONNECT_WINDOW) && player.socketId !== socket.id) {
			console.log(`⛔ Анти-твинк: ${name} пытается открыть вторую вкладку.`);
			socket.emit("handshake_error", "Вторая вкладка запрещена! 🚫");
			return;
		}

		if (gameState.status === "playing" && !player) {
			socket.emit("handshake_error", "Игра уже идет! 🚂");
			return;
		}

		if (player) {
			player.socketId = socket.id;
			player.isOnline = true;
			player.lastHeartbeat = now;

			if (gameState.status === "waiting" && name) player.name = name;

			console.log(`🔄 Реконнект: ${player.name}`);
			socket.emit("handshake_success", player);
		} else {
			player = {
				userId,
				socketId: socket.id,
				name: name || `Игрок`,
				avatar: avatar || "😎",
				score: 0,
				isOnline: true,
				lastHeartbeat: now
			};
			gameState.players[userId] = player;
			console.log(`👋 Новый: ${player.name}`);
			socket.emit("handshake_success", player);
		}
	});

	socket.on("heartbeat", (data, callback) => {
		const player = Object.values(gameState.players).find(p => p.socketId === socket.id);

		if (player) {
			player.lastHeartbeat = Date.now();
			player.isOnline = true;

			if (data && typeof data.ping === "number") {
				player.ping = data.ping;
			}

			if (callback) callback();

		} else {
			socket.emit("force_reconnect");
		}
	});

	socket.on("disconnect", () => {
		if (socket.id === gameState.hostSocketId) {
			console.log("🔌 Хост отключился");
			gameState.hostSocketId = null;
		}
	});
});

const PORT = 3001;
server.listen(PORT, () => {
	console.log(`🚀 REAL-TIME SERVER ON ${PORT} (Tick: ${TICK_RATE}Hz)`);
});