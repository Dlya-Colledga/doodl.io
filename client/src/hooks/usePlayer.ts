import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { getUserId } from "../utils/session";

export const usePlayer = () => {
	const [joined, setJoined] = useState(false);
	const [error, setError] = useState("");
	const [playerData, setPlayerData] = useState<any>(null);
	const [ping, setPing] = useState(0);

	const heartbeatRef = useRef<number | null>(null);
	const nameRef = useRef("");
	const pingRef = useRef(0);

	useEffect(() => {
		if (!socket.connected) socket.connect();

		const onHandshakeSuccess = (data: any) => {
			setJoined(true);
			setPlayerData(data);
			setError("");
			startHeartbeat();
		};

		const onHandshakeError = (msg: string) => {
			setJoined(false);
			setError(msg);
			stopHeartbeat();
		};

		const onForceReconnect = () => {
			console.log("⚠️ Сервер забыл нас. Пробуем войти заново.");
			if (nameRef.current) joinGame(nameRef.current);
		};

		const onConnect = () => {
			console.log("Socket connected");
			if (nameRef.current) joinGame(nameRef.current);
		};

		socket.on("handshake_success", onHandshakeSuccess);
		socket.on("handshake_error", onHandshakeError);
		socket.on("force_reconnect", onForceReconnect);
		socket.on("connect", onConnect);

		return () => {
			socket.off("handshake_success", onHandshakeSuccess);
			socket.off("handshake_error", onHandshakeError);
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

	return { joined, error, joinGame, playerData, ping };
};