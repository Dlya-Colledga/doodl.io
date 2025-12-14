import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { getUserId } from "../utils/session";

export const usePlayer = () => {
	const [joined, setJoined] = useState(false);
	const [error, setError] = useState("");
	const [playerData, setPlayerData] = useState<any>(null);
	const [ping, setPing] = useState(0);

	const [gameStatus, setGameStatus] = useState<"waiting" | "playing">("waiting");
	const [phase, setPhase] = useState<string | null>(null);

	// НОВОЕ: Хранение сообщений
	const [messages, setMessages] = useState<any[]>([]);

	const heartbeatRef = useRef<number | null>(null);
	const nameRef = useRef("");
	const pingRef = useRef(0);

	useEffect(() => {
		if (!socket.connected) socket.connect();

		const onHandshakeSuccess = (data: any) => {
			setJoined(true);
			setPlayerData(data);
			setGameStatus(data.status);
			setPhase(data.phase);
			// Если сервер прислал историю сообщений при входе
			if (data.messages) setMessages(data.messages);
			setError("");
			startHeartbeat();
		};

		const onHandshakeError = (msg: string) => {
			setJoined(false);
			setError(msg);
			stopHeartbeat();
		};

		const onGameStateUpdate = (data: { status: "waiting" | "playing", phase: string }) => {
			setGameStatus(data.status);
			setPhase(data.phase);
		};

		// НОВОЕ: Слушаем новые сообщения
		const onNewMessage = (msg: any) => {
			setMessages((prev) => [...prev, msg]);
		};

		const onForceReconnect = () => {
			console.log("⚠️ Сервер забыл нас. Пробуем войти заново.");
			if (nameRef.current) joinGame(nameRef.current);
		};

		const onConnect = () => {
			if (nameRef.current) joinGame(nameRef.current);
		};

		socket.on("handshake_success", onHandshakeSuccess);
		socket.on("handshake_error", onHandshakeError);
		socket.on("game_state_update", onGameStateUpdate);
		socket.on("chat_new_message", onNewMessage); // Подписка
		socket.on("force_reconnect", onForceReconnect);
		socket.on("connect", onConnect);

		return () => {
			socket.off("handshake_success", onHandshakeSuccess);
			socket.off("handshake_error", onHandshakeError);
			socket.off("game_state_update", onGameStateUpdate);
			socket.off("chat_new_message", onNewMessage);
			socket.off("force_reconnect", onForceReconnect);
			socket.off("connect", onConnect);
			stopHeartbeat();
		};
	}, []);

	const startHeartbeat = () => {
		if (heartbeatRef.current) return;
		heartbeatRef.current = window.setInterval(() => {
			if (socket.connected) {
				const start = Date.now();
				socket.emit("heartbeat", { ping: pingRef.current }, () => {
					const latency = Date.now() - start;
					pingRef.current = latency;
					setPing(latency);
				});
			}
		}, 1000);
	};

	const stopHeartbeat = () => {
		if (heartbeatRef.current) {
			clearInterval(heartbeatRef.current);
			heartbeatRef.current = null;
		}
	};

	const joinGame = (name: string) => {
		if (!name.trim()) return;
		nameRef.current = name;
		setError("");
		const userId = getUserId();
		const avatarUrl = `https://api.dicebear.com/9.x/open-peeps/svg?seed=${userId}`;
		socket.emit("player_handshake", { name, userId, avatar: avatarUrl });
	};

	const sendMessage = (text: string) => {
		socket.emit("player_message", text);
	};

	return { joined, error, joinGame, playerData, ping, gameStatus, phase, messages, sendMessage };
};