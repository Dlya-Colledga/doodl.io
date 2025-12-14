import React, { useState, useEffect, useRef } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { Button } from "../ui/Button";
import { socket } from "../../socket";
import { HiPaperAirplane, HiWifi } from "react-icons/hi2";

export const PlayerLobby: React.FC = () => {
	const [nickname, setNickname] = useState("");
	const [msgText, setMsgText] = useState("");
	const [spamBlock, setSpamBlock] = useState(false);
	const [blockTimer, setBlockTimer] = useState(0);

	// Достаем messages из хука
	const { joined, error, joinGame, playerData, ping, gameStatus, phase, messages, sendMessage } = usePlayer();
	const isConnected = socket.connected;

	// Автоскролл
	const messagesEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (joined && phase === "drawing") {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, phase, joined]);

	useEffect(() => {
		let interval: number;
		if (spamBlock && blockTimer > 0) {
			interval = window.setInterval(() => {
				setBlockTimer((prev) => prev - 1);
			}, 1000);
		} else if (blockTimer === 0) {
			setSpamBlock(false);
		}
		return () => clearInterval(interval);
	}, [spamBlock, blockTimer]);

	const handleSend = () => {
		if (!msgText.trim() || spamBlock) return;
		sendMessage(msgText);
		setMsgText("");
		setSpamBlock(true);
		setBlockTimer(3);
	};

	// --- 1. ЛОББИ / ОЖИДАНИЕ ---
	if (joined && (gameStatus === "waiting" || phase !== "drawing")) {
		return (
			<div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-center text-white relative">
				<div className="absolute top-4 right-4 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
					<span className="font-mono text-sm font-bold">{ping}ms</span>
					<HiWifi className="w-5 h-5" />
				</div>

				<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 animate-bounce border-4 border-white/20">
					{playerData?.avatar?.startsWith("http") ? (
						<img src={playerData.avatar} alt="av" className="w-full h-full object-cover rounded-full" />
					) : "😎"}
				</div>

				<h1 className="text-3xl font-bold mb-2">
					{gameStatus === "waiting" ? "Ждем хоста..." : "Смотри на экран!"}
				</h1>

				{phase === "countdown" && (
					<div className="mt-4 text-6xl font-black text-yellow-300 animate-pulse">
						ПРИГОТОВЬСЯ!
					</div>
				)}

				<p className="text-indigo-200 mt-2">
					{phase === "choosing" && "Художник выбирает слово..."}
				</p>
			</div>
		);
	}

	// --- 2. ИГРА (ЧАТ) ---
	if (joined && gameStatus === "playing" && phase === "drawing") {
		return (
			<div className="fixed inset-0 bg-slate-900 flex flex-col">
				{/* Шапка */}
				<div className="flex items-center justify-between p-4 bg-slate-800 shrink-0 shadow-md z-10">
					<div className="flex items-center gap-3">
						<img src={playerData.avatar} className="w-10 h-10 rounded-full bg-white" alt="me" />
						<div className="leading-tight">
							<p className="font-bold text-white max-w-[150px] truncate">{playerData.name}</p>
							<p className="text-xs text-slate-400">Score: {playerData.score}</p>
						</div>
					</div>
					<div className="bg-black/30 px-3 py-1 rounded-full text-xs font-mono text-slate-400">
						{ping}ms
					</div>
				</div>

				{/* ОБЛАСТЬ ЧАТА (НОВОЕ) */}
				<div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900">
					{messages.length === 0 && (
						<div className="text-center text-slate-600 mt-10">
							<p>Здесь пока пусто...</p>
							<p className="text-sm">Угадывай слово!</p>
						</div>
					)}
					{messages.map((msg, i) => (
						<div key={i} className="flex gap-2 items-start animate-fade-in-up">
							<img src={msg.avatar} className="w-8 h-8 rounded-full bg-slate-200 shrink-0" alt="av" />
							<div className="bg-slate-800 p-2 rounded-r-xl rounded-bl-xl max-w-[85%]">
								<p className="text-xs text-indigo-400 font-bold mb-0.5">{msg.author}</p>
								<p className="text-white text-sm break-words">{msg.text}</p>
							</div>
						</div>
					))}
					<div ref={messagesEndRef} />
				</div>

				{/* Ввод */}
				<div className="p-3 bg-slate-800 shrink-0 pb-safe">
					<div className="flex gap-2">
						<input
							type="text"
							value={msgText}
							onChange={(e) => setMsgText(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSend()}
							disabled={spamBlock}
							placeholder={spamBlock ? `Жди ${blockTimer}с...` : "Твой ответ..."}
							className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none transition-colors disabled:opacity-50"
						/>
						<Button
							onClick={handleSend}
							disabled={spamBlock || !msgText.trim()}
							className={`px-4 rounded-xl ${spamBlock ? "bg-slate-700" : "bg-indigo-600"}`}
						>
							<HiPaperAirplane className={`w-6 h-6 text-white ${spamBlock ? "" : "-rotate-45 mb-1"}`} />
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// --- 3. ВХОД ---
	return (
		<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
			{/* ...без изменений... */}
			<div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
				<div className="text-center mb-6">
					<h2 className="text-3xl font-black text-slate-800">Doodl.io</h2>
					<p className="text-slate-500">Введи имя и залетай!</p>
				</div>
				{error && <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm font-bold text-center animate-pulse">{error}</div>}
				<input
					type="text"
					value={nickname}
					onChange={(e) => setNickname(e.target.value)}
					placeholder="Твой никнейм..."
					className="w-full text-2xl font-bold text-slate-900 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 mb-2 focus:outline-none focus:border-indigo-500 transition-colors"
					maxLength={12}
				/>
				<Button size="lg" className="w-full mt-2" onClick={() => joinGame(nickname)} disabled={!isConnected}>
					{isConnected ? "Войти" : "Подключение..."}
				</Button>
			</div>
		</div>
	);
};