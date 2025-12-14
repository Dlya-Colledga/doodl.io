import React, { useState, useEffect, useRef } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { useGameSound } from "../../hooks/useGameSound";
import { Button } from "../ui/Button";
import { socket } from "../../socket";
import { HiPaperAirplane, HiWifi, HiPencil, HiClock } from "react-icons/hi2";
import { Roulette } from "../game/Roulette";
import { CanvasBoard } from "../game/CanvasBoard";

export const PlayerLobby: React.FC = () => {
	const [nickname, setNickname] = useState("");
	const [msgText, setMsgText] = useState("");
	const [spamBlock, setSpamBlock] = useState(false);
	const [blockTimer, setBlockTimer] = useState(0);

	const {
		joined, error, joinGame, playerData, ping,
		gameStatus, phase, players, messages, sendMessage,
		currentArtistId, roundWinner, wordsToChoose, selectWord, currentWord,
		time, round
	} = usePlayer();

	const isConnected = socket.connected;
	const isArtist = currentArtistId === playerData?.userId;

	useGameSound({
		phase: phase || "lobby",
		status: gameStatus,
		isWin: !!roundWinner,
		enableMusic: false
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (joined && phase === "drawing") {
			messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, phase, joined]);

	useEffect(() => {
		let interval: number;
		if (spamBlock && blockTimer > 0) {
			interval = window.setInterval(() => setBlockTimer((prev) => prev - 1), 1000);
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
		setBlockTimer(2);
	};

	const TimerBar = () => (
		<div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
			<div
				className="h-full bg-green-500 transition-all duration-1000 linear"
				style={{ width: `${(time / 90) * 100}%` }}
			/>
		</div>
	);

	if (!joined) {
		return (
			<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900"></div>
				<div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl z-10 animate-fade-in-up">
					<div className="text-center mb-6">
						<h2 className="text-4xl font-black text-slate-800 tracking-tighter">Doodl.io</h2>
						<p className="text-slate-500 font-medium">Рисуй, угадывай, побеждай!</p>
					</div>
					{error && <div className="bg-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold text-center animate-shake">{error}</div>}
					<input
						type="text"
						value={nickname}
						onChange={(e) => setNickname(e.target.value)}
						placeholder="Твой никнейм..."
						className="w-full text-2xl font-bold text-slate-900 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-4 mb-3 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-center placeholder:font-normal"
						maxLength={12}
					/>
					<Button size="lg" className="w-full py-4 text-xl shadow-lg shadow-indigo-500/30" onClick={() => joinGame(nickname)} disabled={!isConnected || !nickname}>
						{isConnected ? "Ворваться в игру 🚀" : "Подключение..."}
					</Button>
				</div>
			</div>
		);
	}

	if (gameStatus === "waiting") {
		return (
			<div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-center text-white relative">
				<div className="absolute top-4 right-4 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
					<span className="font-mono text-sm font-bold">{ping}ms</span>
					<HiWifi className="w-5 h-5" />
				</div>
				<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 animate-bounce border-4 border-white/20">
					<img src={playerData?.avatar} alt="av" className="w-full h-full object-cover rounded-full" />
				</div>
				<h1 className="text-3xl font-bold mb-2">Ждем хоста...</h1>
				<p className="text-indigo-200">Приготовься рисовать шедевры!</p>
			</div>
		);
	}

	if (gameStatus === "finished") {
		const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
		const myRank = sortedPlayers.findIndex(p => p.userId === playerData?.userId) + 1;

		return (
			<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
				<h1 className="text-4xl font-black text-yellow-400 mb-8">ИГРА ОКОНЧЕНА</h1>

				<div className="bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/10">
					<img src={playerData?.avatar} className="w-24 h-24 rounded-full mx-auto mb-4 bg-white" />
					<h2 className="text-2xl font-bold mb-2">{playerData?.name}</h2>

					<div className="grid grid-cols-2 gap-4 mt-6">
						<div className="bg-indigo-600/20 p-4 rounded-2xl">
							<p className="text-slate-400 text-sm uppercase">Очки</p>
							<p className="text-3xl font-black text-indigo-400">{playerData?.score}</p>
						</div>
						<div className="bg-yellow-600/20 p-4 rounded-2xl">
							<p className="text-slate-400 text-sm uppercase">Место</p>
							<p className="text-3xl font-black text-yellow-400">#{myRank}</p>
						</div>
					</div>
				</div>

				<p className="mt-8 text-slate-500">Посмотрите на главный экран для награждения!</p>
			</div>
		);
	}

	if (phase === "roulette" && currentArtistId) {
		return <Roulette players={players} winnerId={currentArtistId} duration={5000} onComplete={() => { }} />;
	}

	if (phase === "choosing") {
		if (isArtist) {
			return (
				<div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50 p-4">
					<h2 className="text-3xl text-white font-bold mb-8 animate-bounce">ВЫБЕРИ СЛОВО!</h2>
					<div className="grid grid-cols-1 gap-4 w-full max-w-sm">
						{wordsToChoose.map((w, i) => (
							<button
								key={i}
								onClick={() => selectWord(w)}
								className="w-full bg-white text-slate-900 py-6 rounded-2xl text-2xl font-black hover:scale-105 hover:bg-yellow-300 transition-all shadow-xl uppercase"
							>
								{w.word}
							</button>
						))}
					</div>
				</div>
			);
		} else {
			return (
				<div className="fixed inset-0 bg-indigo-600 flex flex-col items-center justify-center text-white p-6 text-center">
					<div className="animate-pulse mb-6">
						<HiPencil className="w-24 h-24 mx-auto opacity-50" />
					</div>
					<h2 className="text-3xl font-bold">Художник выбирает слово...</h2>
					<p className="text-indigo-200 mt-2">Готовь пальцы для ответов!</p>
				</div>
			);
		}
	}

	if (phase === "countdown") {
		return (
			<div className="fixed inset-0 bg-indigo-900 flex items-center justify-center z-50">
				<h1 className="text-[10rem] font-black text-yellow-400 animate-ping">!</h1>
			</div>
		);
	}

	if (phase === "result") {
		const isMeWinner = roundWinner?.userId === playerData?.userId;
		return (
			<div className={`fixed inset-0 flex flex-col items-center justify-center z-50 p-6 text-center animate-fade-in ${isMeWinner ? "bg-green-600" : "bg-slate-800"}`}>
				<h2 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
					{roundWinner ? (isMeWinner ? "ТЫ УГАДАЛ! 🎉" : "РАУНД ОКОНЧЕН") : "ВРЕМЯ ВЫШЛО 💀"}
				</h2>
				<div className="bg-black/20 p-6 rounded-3xl backdrop-blur-sm">
					<p className="text-indigo-200 text-lg uppercase tracking-widest mb-1">Слово было</p>
					<p className="text-4xl text-white font-black uppercase">{currentWord}</p>
				</div>
				{roundWinner && !isMeWinner && (
					<div className="mt-8 flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full">
						<img src={roundWinner.avatar} className="w-10 h-10 rounded-full bg-white" alt="win" />
						<span className="text-white font-bold text-xl">{roundWinner.name} победил</span>
					</div>
				)}
			</div>
		);
	}

	if (phase === "drawing") {
		return (
			<div className="fixed inset-0 bg-slate-900 flex flex-col h-[100dvh]">
				<div className="flex items-center justify-between p-3 bg-slate-800 shrink-0 shadow-md z-10 border-b border-white/5 relative">
					<TimerBar />
					<div className="flex items-center gap-3">
						<div className="relative">
							<img src={playerData?.avatar} className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500" alt="me" />
							<div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 rounded-full border border-slate-800">
								{playerData?.score}
							</div>
						</div>
						<div className="leading-tight">
							<p className="font-bold text-white max-w-[100px] truncate">{playerData?.name}</p>
							<p className="text-xs text-slate-400">Раунд {round} / 10</p>
						</div>
					</div>
					<div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-full text-xs font-mono text-slate-400">
						<HiClock className="w-3 h-3 text-yellow-500" />
						{time}s
					</div>
				</div>

				{isArtist ? (
					<div className="flex-1 relative bg-slate-200 overflow-hidden">
						<div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex justify-center pointer-events-none">
							<div className="bg-yellow-400 text-slate-900 font-black text-xl md:text-2xl px-8 py-3 rounded-full shadow-[0_4px_0_rgba(0,0,0,0.2)] border-4 border-slate-900 animate-bounce-in">
								🎨 РИСУЙ: {currentWord.toUpperCase()}
							</div>
						</div>
						<CanvasBoard isArtist={true} />
					</div>
				) : (
					<div className="flex-1 flex flex-col min-h-0">
						<div className="h-[40vh] bg-slate-200 relative border-b-4 border-slate-800 shrink-0">
							<CanvasBoard isArtist={false} />
						</div>

						<div className="flex-1 bg-slate-900 overflow-y-auto p-4 space-y-3 custom-scrollbar">
							{messages.map((msg, i) => (
								<div key={i} className={`flex gap-2 items-start ${msg.isSystem ? "justify-center" : ""}`}>
									{msg.isSystem ? (
										<div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
											{msg.text}
										</div>
									) : (
										<div className="bg-slate-800 p-2 rounded-xl text-sm text-white border border-slate-700 max-w-[90%]">
											<span className="font-bold text-indigo-400 mr-2 block text-xs">{msg.author}</span>
											{msg.text}
										</div>
									)}
								</div>
							))}
							<div ref={messagesEndRef} />
						</div>

						<div className="p-3 bg-slate-800 shrink-0 pb-safe border-t border-white/5">
							<div className="flex gap-2">
								<input
									type="text"
									value={msgText}
									onChange={(e) => setMsgText(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && handleSend()}
									disabled={spamBlock}
									placeholder={spamBlock ? `Жди...` : "Ответ..."}
									className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-indigo-500 outline-none"
								/>
								<Button onClick={handleSend} disabled={spamBlock || !msgText.trim()} className="px-4 rounded-xl bg-indigo-600">
									<HiPaperAirplane />
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		);
	}

	return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Загрузка...</div>;
};