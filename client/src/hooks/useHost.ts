import { useEffect, useState } from "react";
import { socket } from "../socket";

export interface Player {
	userId: string;
	name: string;
	avatar: string;
	score: number;
	isOnline: boolean;
	ping: number;
}

export interface ChatMessage {
	id: string;
	author: string;
	avatar: string;
	text: string;
	isSystem: boolean;
}

export const useHost = () => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [gameStatus, setGameStatus] = useState<"waiting" | "playing">("waiting");
	const [phase, setPhase] = useState<"choosing" | "countdown" | "drawing" | null>(null);
	const [messages, setMessages] = useState<ChatMessage[]>([]);

	useEffect(() => {
		const onConnect = () => {
			setIsConnected(true);
			socket.emit("host_login", "SECRET_TASK_PASS");
		};
		const onDisconnect = () => setIsConnected(false);

		const onGameTick = (state: {
			players: Player[],
			status: "waiting" | "playing",
			phase: any,
			messages: ChatMessage[]
		}) => {
			setPlayers(state.players);
			setGameStatus(state.status);
			setPhase(state.phase);
			setMessages(state.messages);
		};

		const onChatMsg = (msg: ChatMessage) => {
			setMessages(prev => [...prev, msg].slice(-50));
		};

		// НОВОЕ: Обработка ошибок хоста
		const onHostError = (msg: string) => {
			console.error("Host Error:", msg);
			alert(`Ошибка хоста: ${msg}`);
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("game_tick", onGameTick);
		socket.on("chat_new_message", onChatMsg);
		socket.on("host_error", onHostError);

		if (socket.connected) onConnect();
		else socket.connect();

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("game_tick", onGameTick);
			socket.off("chat_new_message", onChatMsg);
			socket.off("host_error", onHostError);
		};
	}, []);

	const startGame = () => {
		console.log("Клик по кнопке старт!"); // Проверка клика
		socket.emit("host_start_game");
	};

	return { players, isConnected, gameStatus, phase, messages, startGame };
};