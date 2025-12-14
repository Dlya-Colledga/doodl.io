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

const TICK_RATE = 1; // 1 Гц
const HEARTBEAT_TIMEOUT = 5000;
const RECONNECT_WINDOW = 2000;
const HOST_PASSWORD = "SECRET_TASK_PASS";

const ROUND_DURATION = 90;
const MAX_ROUNDS = 10;
const ROULETTE_DURATION = 6000;

const WORD_DATABASE = [
	// Простые предметы
	{ word: "Дом", variants: ["дом", "house"] },
	{ word: "Ключ", variants: ["ключ"] },
	{ word: "Часы", variants: ["часы", "watch", "clock"] },
	{ word: "Книга", variants: ["книга", "book"] },
	{ word: "Стол", variants: ["стол", "table"] },
	{ word: "Стул", variants: ["стул", "chair"] },
	{ word: "Лампа", variants: ["лампа"] },
	{ word: "Телефон", variants: ["телефон", "смартфон"] },

	// Еда
	{ word: "Пицца", variants: ["пицца", "pizza"] },
	{ word: "Яблоко", variants: ["яблоко", "apple"] },
	{ word: "Бургер", variants: ["бургер", "burger"] },
	{ word: "Мороженое", variants: ["мороженое", "ice cream"] },
	{ word: "Торт", variants: ["торт", "cake"] },

	// Животные (идеально для рисования)
	{ word: "Кот", variants: ["кот", "кошка", "cat"] },
	{ word: "Собака", variants: ["собака", "пёс", "dog"] },
	{ word: "Рыба", variants: ["рыба", "fish"] },
	{ word: "Птица", variants: ["птица", "bird"] },
	{ word: "Корова", variants: ["корова", "cow"] },
	{ word: "Лошадь", variants: ["лошадь", "horse"] },

	// Транспорт
	{ word: "Машина", variants: ["машина", "авто", "car"] },
	{ word: "Велосипед", variants: ["велосипед", "bike"] },
	{ word: "Самолёт", variants: ["самолет", "plane"] },
	{ word: "Поезд", variants: ["поезд", "train"] },
	{ word: "Трактор", variants: ["трактор"] },

	// Инструменты
	{ word: "Молоток", variants: ["молоток"] },
	{ word: "Шуруповёрт", variants: ["шуруповерт", "шуруповёрт"] },
	{ word: "Пила", variants: ["пила"] },
	{ word: "Ножницы", variants: ["ножницы"] },

	// Природа
	{ word: "Солнце", variants: ["солнце", "sun"] },
	{ word: "Луна", variants: ["луна", "moon"] },
	{ word: "Дерево", variants: ["дерево", "tree"] },
	{ word: "Гора", variants: ["гора", "mountain"] },
	{ word: "Облако", variants: ["облако", "cloud"] },
	{ word: "Река", variants: ["река", "river"] },

	// Люди и действия (через рисунок)
	{ word: "Человек", variants: ["человек"] },
	{ word: "Бег", variants: ["бег", "бежать", "running"] },
	{ word: "Прыжок", variants: ["прыжок", "прыгать"] },
	{ word: "Сон", variants: ["сон", "sleep"] },
	{ word: "Смех", variants: ["смех", "laugh"] },

	// Игры и поп-культура
	{ word: "Майнкрафт", variants: ["майнкрафт", "minecraft"] },
	{ word: "Меч", variants: ["меч", "sword"] },
	{ word: "Щит", variants: ["щит", "shield"] },
	{ word: "Дракон", variants: ["дракон", "dragon"] },

	// Места
	{ word: "Замок", variants: ["замок", "castle"] },
	{ word: "Школа", variants: ["школа"] },
	{ word: "Магазин", variants: ["магазин"] },
	{ word: "Пляж", variants: ["пляж", "beach"] },
];


let gameState = {
	status: "waiting",
	phase: "lobby",
	round: 0,
	time: 0,
	players: {},
	messages: [],
	drawingHistory: [],
	redoStack: [],

	hostSocketId: null,
	currentArtistId: null,
	currentWord: null,
	wordOptions: [],
	roundWinner: null,
};

const getRandomWords = (count) => {
	const shuffled = [...WORD_DATABASE].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
};

// Алгоритм Левенштейна (расстояние между словами)
const getLevenshteinDistance = (a, b) => {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;
	const matrix = [];
	for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
	for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1
				);
			}
		}
	}
	return matrix[b.length][a.length];
};

const checkGuess = (msg, variants) => {
	if (!msg || !variants || variants.length === 0) return false;

	const cleanMsg = msg.toLowerCase().replace(/[^a-zа-яё0-9\s]/g, " ");
	const words = cleanMsg.split(/\s+/).filter(w => w.length > 0);

	for (const word of words) {
		for (const variant of variants) {
			if (word === variant) return true;

			if (variant.length > 3 && Math.abs(variant.length - word.length) <= 2) {
				const dist = getLevenshteinDistance(word, variant);

				const maxErrors = variant.length > 5 ? 2 : 1;

				if (dist <= maxErrors) return true;
			}
		}
	}
	return false;
};

setInterval(() => {
	const now = Date.now();
	const playerList = Object.values(gameState.players);

	playerList.forEach(player => {
		if (player.isOnline && (now - player.lastHeartbeat > HEARTBEAT_TIMEOUT)) {
			player.isOnline = false;
		}
	});

	if (gameState.status === "playing") {
		if (gameState.phase === "drawing") {
			if (gameState.time > 0) gameState.time--;
			else endRound(null);
		}
		if (gameState.phase === "countdown") {
			if (gameState.time > 0) gameState.time--;
			else startDrawingPhase();
		}
	}

	io.emit("game_tick", {
		status: gameState.status,
		phase: gameState.phase,
		time: gameState.time,
		round: gameState.round,
		currentArtistId: gameState.currentArtistId,
		currentWordLength: gameState.currentWord ? gameState.currentWord.word.length : 0,
		currentWord: (gameState.phase === "result") ? (gameState.currentWord ? gameState.currentWord.word : "") : null,
		players: playerList,
		messages: gameState.messages,
		roundWinner: gameState.roundWinner
	});
}, 1000 / TICK_RATE);

const startRoulette = () => {
	gameState.phase = "roulette";
	gameState.round++;

	if (gameState.round > MAX_ROUNDS) {
		gameState.status = "finished";
		io.emit("game_tick", {
			status: "finished",
			phase: "result",
			players: Object.values(gameState.players),
		});
		io.emit("game_over");
		console.log("🏁 ИГРА ЗАВЕРШЕНА");
		return;
	}

	if (gameState.round > MAX_ROUNDS) {
		gameState.status = "finished";
		io.emit("game_over");
		return;
	}

	const onlinePlayers = Object.values(gameState.players).filter(p => p.isOnline);
	if (onlinePlayers.length === 0) return;

	const randomPlayer = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
	gameState.currentArtistId = randomPlayer.userId;
	gameState.roundWinner = null;

	gameState.messages = [];
	gameState.drawingHistory = [];
	gameState.redoStack = [];
	gameState.currentWord = null;

	console.log(`🎰 РУЛЕТКА: Раунд ${gameState.round}, Художник: ${randomPlayer.name}`);

	io.emit("state_update", { phase: "roulette", artistId: gameState.currentArtistId, round: gameState.round });
	io.emit("canvas_clear");

	setTimeout(() => startChoosingPhase(), ROULETTE_DURATION);
};

const startChoosingPhase = () => {
	gameState.phase = "choosing";
	gameState.wordOptions = getRandomWords(3);
	const artistSocketId = Object.values(gameState.players).find(p => p.userId === gameState.currentArtistId)?.socketId;
	if (artistSocketId) io.to(artistSocketId).emit("your_turn_to_choose", gameState.wordOptions);
	io.emit("state_update", { phase: "choosing" });
};

const startDrawingPhase = () => {
	gameState.phase = "drawing";
	gameState.time = ROUND_DURATION;
	io.emit("state_update", { phase: "drawing", time: ROUND_DURATION });
	io.emit("play_sound", "start");
};

const endRound = (winnerId) => {
	gameState.phase = "result";
	gameState.roundWinner = winnerId ? gameState.players[winnerId] : null;
	if (winnerId) gameState.players[winnerId].score += 100;

	io.emit("round_end", {
		winner: gameState.roundWinner,
		word: gameState.currentWord ? gameState.currentWord.word : "???"
	});

	setTimeout(() => startRoulette(), 5000);
};

io.on("connection", (socket) => {
	socket.on("host_login", (password) => {
		const isLocal = true;
		if (!isLocal) { socket.emit("host_error", "Access denied"); return; }
		if (password === HOST_PASSWORD) {
			gameState.hostSocketId = socket.id;
			console.log(`✅ ХОСТ ПОДКЛЮЧЕН: ${socket.id}`);
			socket.emit("game_state_update", { status: gameState.status, phase: gameState.phase });
		}
	});

	socket.on("host_start_game", () => {
		if (gameState.status === "waiting") {
			gameState.status = "playing";
			gameState.round = 0;
			Object.values(gameState.players).forEach(p => p.score = 0);
			startRoulette();
		}
	});

	socket.on("artist_select_word", (wordObj) => {
		const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
		if (player && player.userId === gameState.currentArtistId && gameState.phase === "choosing") {
			gameState.currentWord = wordObj;
			gameState.phase = "countdown";
			gameState.time = 3;
			io.emit("state_update", { phase: "countdown", wordLength: wordObj.word.length });
		}
	});

	socket.on("player_message", (text) => {
		const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
		if (!player || !text) return;

		if (gameState.phase === "drawing" && player.userId !== gameState.currentArtistId) {
			const isCorrect = gameState.currentWord && checkGuess(text, gameState.currentWord.variants);

			if (isCorrect) {
				endRound(player.userId);
				const winMsg = { id: Date.now(), author: "СИСТЕМА", avatar: "", text: `${player.name} угадал слово!`, isSystem: true };
				gameState.messages.push(winMsg);
				io.emit("chat_new_message", winMsg);
				return;
			}
		}
		const msg = { id: Date.now(), author: player.name, avatar: player.avatar, text: text, isSystem: false };
		gameState.messages.push(msg);
		io.emit("chat_new_message", msg);
	});

	socket.on("draw_line", (data) => {
		if (gameState.phase === "drawing" && gameState.currentArtistId) {
			const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
			if (player && player.userId === gameState.currentArtistId) {
				if (data.type === "start") gameState.redoStack = [];
				gameState.drawingHistory.push(data);
				socket.broadcast.emit("draw_line", data);
				if (gameState.hostSocketId) io.to(gameState.hostSocketId).emit("draw_line", data);
			}
		}
	});

	socket.on("canvas_undo", () => {
		if (gameState.phase === "drawing" && gameState.currentArtistId) {
			const lastStartIndex = gameState.drawingHistory.findLastIndex(item => item.type === "start");
			if (lastStartIndex !== -1) {
				const removedStroke = gameState.drawingHistory.splice(lastStartIndex);
				gameState.redoStack.push(removedStroke);
				io.emit("canvas_history_update", gameState.drawingHistory);
			}
		}
	});

	socket.on("canvas_redo", () => {
		if (gameState.phase === "drawing" && gameState.currentArtistId) {
			const strokeToRedo = gameState.redoStack.pop();
			if (strokeToRedo) {
				gameState.drawingHistory.push(...strokeToRedo);
				io.emit("canvas_history_update", gameState.drawingHistory);
			}
		}
	});

	socket.on("canvas_clear", () => {
		if (gameState.phase === "drawing" && gameState.currentArtistId) {
			gameState.redoStack.push([...gameState.drawingHistory]);
			gameState.drawingHistory = [];
			io.emit("canvas_clear");
		}
	});

	socket.on("request_canvas_history", () => {
		socket.emit("canvas_history_update", gameState.drawingHistory);
	});

	socket.on("player_handshake", (data) => {
		const { name, userId, avatar } = data;
		const now = Date.now();
		let player = gameState.players[userId];

		if (player && player.isOnline && (now - player.lastHeartbeat < RECONNECT_WINDOW) && player.socketId !== socket.id) {
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
			socket.emit("handshake_success", { ...player, status: gameState.status, phase: gameState.phase });
		} else {
			player = { userId, socketId: socket.id, name: name || `Игрок`, avatar: avatar || "😎", score: 0, isOnline: true, lastHeartbeat: now };
			gameState.players[userId] = player;
			socket.emit("handshake_success", { ...player, status: gameState.status, phase: gameState.phase });
		}
	});

	socket.on("heartbeat", (data, callback) => {
		const player = Object.values(gameState.players).find(p => p.socketId === socket.id);
		if (player) {
			player.lastHeartbeat = Date.now();
			player.isOnline = true;
			if (data && typeof data.ping === "number") player.ping = data.ping;
			if (callback) callback();
		} else {
			socket.emit("force_reconnect");
		}
	});

	socket.on("disconnect", () => {
		if (socket.id === gameState.hostSocketId) gameState.hostSocketId = null;
	});
});

const PORT = 3001;
server.listen(PORT, () => {
	console.log(`🚀 SERVER ON ${PORT}`);
});