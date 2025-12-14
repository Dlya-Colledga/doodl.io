import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { getUserId } from "../utils/session";

export interface Player {
	userId: string;
	socketId: string;
	name: string;
	avatar: string;
	score: number;
	isOnline: boolean;
}

export const usePlayer = () => {
	const [joined, setJoined] = useState(false);
	const [error, setError] = useState("");
	const [playerData, setPlayerData] = useState<Player | null>(null);
	const [ping, setPing] = useState(0);

	const [gameStatus, setGameStatus] = useState<"waiting" | "playing" | "finished">("waiting");

	const [phase, setPhase] = useState<string | null>(null);
	const [players, setPlayers] = useState<Player[]>([]);

	const [time, setTime] = useState(0);
	const [round, setRound] = useState(0);

	const [currentArtistId, setCurrentArtistId] = useState<string | null>(null);
	const [roundWinner, setRoundWinner] = useState<Player | null>(null);
	const [currentWord, setCurrentWord] = useState<string>("");

	const [wordsToChoose, setWordsToChoose] = useState<any[]>([]);
	const [messages, setMessages] = useState<any[]>([]);

	const heartbeatRef = useRef<number | null>(null);
	const nameRef = useRef("");
	const pingRef = useRef(0);

	useEffect(() => {
		if (!socket.connected) socket.connect();

		const onHandshakeSuccess = (data: any) => {
			setJoined(true);
			setPlayerData(data);
			setGameStatus(data.status || "waiting");
			setPhase(data.phase || "lobby");
			if (data.messages) setMessages(data.messages);
			setError("");
			startHeartbeat();
		};

		const onHandshakeError = (msg: string) => {
			setJoined(false);
			setError(msg);
			stopHeartbeat();
		};

		const onGameTick = (state: any) => {
			setGameStatus(state.status);
			setPhase(state.phase);
			setPlayers(state.players || []);
			setTime(state.time);
			setRound(state.round);

			setCurrentArtistId(state.currentArtistId);
			setRoundWinner(state.roundWinner);

			if (state.phase === "roulette") {
				setCurrentWord("");
			}
			else if (state.currentWord) {
				setCurrentWord(state.currentWord);
			}

			if (state.phase !== "choosing") {
				setWordsToChoose([]);
			}
		};

		const onYourTurnToChoose = (words: any[]) => {
			setWordsToChoose(words);
		};

		const onNewMessage = (msg: any) => {
			setMessages((prev) => [...prev, msg].slice(-50));
		};

		const onForceReconnect = () => {
			if (nameRef.current) joinGame(nameRef.current);
		};

		const onConnect = () => {
			if (nameRef.current) joinGame(nameRef.current);
		};

		socket.on("handshake_success", onHandshakeSuccess);
		socket.on("handshake_error", onHandshakeError);
		socket.on("game_tick", onGameTick);
		socket.on("your_turn_to_choose", onYourTurnToChoose);
		socket.on("chat_new_message", onNewMessage);
		socket.on("force_reconnect", onForceReconnect);
		socket.on("connect", onConnect);

		return () => {
			socket.off("handshake_success", onHandshakeSuccess);
			socket.off("handshake_error", onHandshakeError);
			socket.off("game_tick", onGameTick);
			socket.off("your_turn_to_choose", onYourTurnToChoose);
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
					pingRef.current = Date.now() - start;
					setPing(pingRef.current);
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

	const selectWord = (wordObj: any) => {
		setCurrentWord(wordObj.word);
		socket.emit("artist_select_word", wordObj);
		setWordsToChoose([]);
	};

	return {
		joined, error, joinGame, playerData, ping,
		gameStatus, phase, players, messages, sendMessage,
		currentArtistId, roundWinner, wordsToChoose, selectWord, currentWord,
		time, round
	};
};