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

export const useHost = () => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isConnected, setIsConnected] = useState(socket.connected);
	const [gameStatus, setGameStatus] = useState<"waiting" | "playing">("waiting");

	useEffect(() => {
		const onConnect = () => {
			setIsConnected(true);
			socket.emit("host_login", "SECRET_TASK_PASS");
		};
		const onDisconnect = () => setIsConnected(false);

		const onGameTick = (state: { players: Player[], status: "waiting" | "playing" }) => {
			setPlayers(state.players);
			setGameStatus(state.status);
		};

		socket.on("connect", onConnect);
		socket.on("disconnect", onDisconnect);
		socket.on("game_tick", onGameTick);

		if (socket.connected) onConnect();
		else socket.connect();

		return () => {
			socket.off("connect", onConnect);
			socket.off("disconnect", onDisconnect);
			socket.off("game_tick", onGameTick);
		};
	}, []);

	const startGame = () => {
		socket.emit("host_start_game");
	};

	return { players, isConnected, gameStatus, startGame };
};