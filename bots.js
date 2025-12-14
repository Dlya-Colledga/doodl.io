const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:3001";
const BOT_COUNT = 50;
const CONNECTION_DELAY = 50;

console.log(`🚀 Запуск атаки клонов: ${BOT_COUNT} ботов на ${SERVER_URL}...`);

let connectedCount = 0;

function createBot(index) {
	const socket = io(SERVER_URL, {
		reconnection: true,
		forceNew: true,
	});

	const botId = `bot-${index}-${Date.now()}`;
	const botName = `Bot #${index}`;
	const botAvatar = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${botId}`;

	socket.on("connect", () => {
		socket.emit("player_handshake", {
			name: botName,
			userId: botId,
			avatar: botAvatar,
		});
	});

	socket.on("handshake_success", () => {
		connectedCount++;
		console.log(`[${index}] ✅ В игре (${connectedCount}/${BOT_COUNT})`);

		setInterval(() => {
			if (socket.connected) {
				const fakePing = Math.floor(Math.random() * 80) + 20;
				socket.emit("heartbeat", { ping: fakePing });
			}
		}, 1000);
	});

	socket.on("disconnect", () => {
		connectedCount--;
		console.log(`[${index}] ❌ Отключен`);
	});
}

for (let i = 1; i <= BOT_COUNT; i++) {
	setTimeout(() => createBot(i), i * CONNECTION_DELAY);
}