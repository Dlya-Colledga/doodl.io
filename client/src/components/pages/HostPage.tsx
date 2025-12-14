import React, { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { HiPencil, HiSpeakerWave, HiSpeakerXMark, HiClock, HiTrophy } from "react-icons/hi2";
import { PlayerGrid } from "../menu/PlayerGrid";
import { useHost } from "../../hooks/useHost";
import { useMenuMusic } from "../../hooks/useMenuMusic";
import { useGameSound } from "../../hooks/useGameSound";
import { Roulette } from "../game/Roulette";
import { Button } from "../ui/Button";
import { CanvasBoard } from "../game/CanvasBoard";

const CountdownDisplay = () => {
	const [count, setCount] = useState(3);
	useEffect(() => {
		const interval = setInterval(() => setCount((prev) => (prev > 1 ? prev - 1 : 1)), 1000);
		return () => clearInterval(interval);
	}, []);
	return (
		<div className="animate-bounce-in text-center z-50">
			<h2 key={count} className="text-[12rem] font-black text-secondary leading-none drop-shadow-[0_10px_0_rgba(0,0,0,0.5)] animate-pop-in">
				{count}
			</h2>
			<p className="text-2xl text-white font-bold uppercase tracking-[1em]">Приготовьтесь</p>
		</div>
	);
};

const ChatMessageItem = ({ msg }: { msg: any }) => (
	<div className={`flex items-start gap-3 mb-2 animate-fade-in-up ${msg.isSystem ? "justify-center my-4" : ""}`}>
		{msg.isSystem ? (
			<span className="bg-green-500/20 text-green-300 border border-green-500/50 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(34,197,94,0.3)]">
				{msg.text}
			</span>
		) : (
			<>
				<img src={msg.avatar} className="w-8 h-8 rounded-full bg-white border border-slate-300" alt="av" />
				<div className="bg-white/90 px-3 py-2 rounded-r-xl rounded-bl-xl shadow-sm max-w-[80%]">
					<span className="font-bold text-xs text-indigo-600 block">{msg.author}</span>
					<span className="text-slate-800 font-medium leading-tight text-sm">{msg.text}</span>
				</div>
			</>
		)}
	</div>
);

const BouncingLetter = ({ char, index, isSecondary = false }: { char: string; index: number; isSecondary?: boolean }) => (
	<span
		className={`inline-block animate-wave ${isSecondary ? "text-secondary" : "text-white"}`}
		style={{ animationDelay: `${index * 0.1}s` }}
	>
		{char}
	</span>
);

export const HostPage: React.FC = () => {
	const [searchParams] = useSearchParams();
	const secret = searchParams.get("secret");
	const ACCESS_PASSWORD = "ArchLunox_Doodl.io";
	const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

	if (!isLocal && secret !== ACCESS_PASSWORD) {
		return <Navigate to="/lobby" replace />;
	}

	const [musicEnabled, setMusicEnabled] = useState(false);

	const {
		players, gameStatus, startGame, phase, messages,
		currentArtistId, roundWinner, currentWord, time, round
	} = useHost();

	const chatEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (messages && messages.length > 0) {
			chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	useMenuMusic(musicEnabled && gameStatus === "waiting");

	useGameSound({
		phase: phase || "lobby",
		status: gameStatus,
		isWin: !!roundWinner,
		enableMusic: true
	});

	if (gameStatus === "finished") {
		const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
		const winner = sortedPlayers[0];

		return (
			<div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white relative overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900 via-slate-900 to-black animate-pulse-slow"></div>

				<h1 className="text-7xl font-black mb-12 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] animate-bounce-in z-10">
					👑 ИГРА ОКОНЧЕНА 👑
				</h1>

				<div className="flex items-end gap-8 z-10">
					{sortedPlayers[1] && (
						<div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
							<img src={sortedPlayers[1].avatar} className="w-32 h-32 rounded-full border-4 border-slate-300 shadow-xl mb-4 bg-white" alt="2nd" />
							<div className="h-40 w-32 bg-slate-700 rounded-t-lg flex items-center justify-center text-4xl font-black text-slate-400 border-t-4 border-slate-300">
								2
							</div>
							<p className="font-bold text-xl mt-2">{sortedPlayers[1].name}</p>
							<p className="text-slate-400">{sortedPlayers[1].score} pts</p>
						</div>
					)}

					{winner && (
						<div className="flex flex-col items-center animate-slide-up z-20">
							<HiTrophy className="w-16 h-16 text-yellow-400 mb-2 animate-bounce" />
							<img src={winner.avatar} className="w-48 h-48 rounded-full border-8 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.6)] mb-6 bg-white" alt="1st" />
							<div className="h-60 w-40 bg-indigo-600 rounded-t-lg flex items-center justify-center text-6xl font-black text-white border-t-8 border-yellow-400 relative overflow-hidden">
								<div className="absolute inset-0 bg-white/10 animate-pulse"></div>
								1
							</div>
							<p className="font-black text-3xl mt-4 text-yellow-400">{winner.name}</p>
							<p className="text-xl text-white font-mono">{winner.score} pts</p>
						</div>
					)}

					{sortedPlayers[2] && (
						<div className="flex flex-col items-center animate-slide-up" style={{ animationDelay: "0.4s" }}>
							<img src={sortedPlayers[2].avatar} className="w-32 h-32 rounded-full border-4 border-amber-700 shadow-xl mb-4 bg-white" alt="3rd" />
							<div className="h-32 w-32 bg-slate-800 rounded-t-lg flex items-center justify-center text-4xl font-black text-amber-700 border-t-4 border-amber-700">
								3
							</div>
							<p className="font-bold text-xl mt-2">{sortedPlayers[2].name}</p>
							<p className="text-slate-400">{sortedPlayers[2].score} pts</p>
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center h-screen p-4 z-10 relative w-full pt-6 overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-700 font-sans">
			<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

			<button
				onClick={() => setMusicEnabled(!musicEnabled)}
				className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors backdrop-blur-md border border-white/10"
			>
				{musicEnabled ? <HiSpeakerWave className="w-8 h-8" /> : <HiSpeakerXMark className="w-8 h-8 text-white/50" />}
			</button>

			<div className={`text-center relative select-none shrink-0 transition-all duration-700 ease-in-out ${gameStatus === "playing" ? "mb-2 scale-50 origin-top opacity-80 hover:opacity-100" : "mb-8"}`}>
				<div className="absolute -right-12 -top-6 animate-wave hidden md:block text-secondary drop-shadow-lg" style={{ animationDelay: "0.6s" }}>
					<HiPencil className="w-16 h-16 rotate-12 text-secondary" stroke="black" strokeWidth="1.2" style={{ paintOrder: "stroke fill" }} />
				</div>
				<h1 className="text-6xl md:text-8xl font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] stroke-black text-stroke-3 flex items-center justify-center gap-1">
					{"Doodl".split("").map((char, i) => <BouncingLetter key={i} char={char} index={i} />)}
					{".io".split("").map((char, i) => <BouncingLetter key={`io-${i}`} char={char} index={i + 5} isSecondary />)}
				</h1>
			</div>

			<div className="flex-1 w-full flex flex-col items-center justify-start min-h-0 overflow-y-auto z-10 scroll-smooth pb-4 no-scrollbar relative">

				{gameStatus === "waiting" && (
					<>
						{players.length > 0 && (
							<div className="mb-6 animate-bounce-in shrink-0">
								<Button size="lg" variant="secondary" onClick={startGame} className="text-2xl px-12 py-4 shadow-[0_0_30px_rgba(251,177,60,0.4)] border-4 border-white/20 hover:scale-105 transition-transform">
									Начать Игру 🚀
								</Button>
							</div>
						)}
						<PlayerGrid players={players} />
					</>
				)}

				{gameStatus === "playing" && (
					<div className="w-full h-full flex items-center justify-center relative">

						{phase === "roulette" && currentArtistId && (
							<Roulette players={players} winnerId={currentArtistId} duration={6000} onComplete={() => { }} />
						)}

						{phase === "choosing" && (
							<div className="animate-zoom-in text-center">
								<h2 className="text-5xl font-black text-white drop-shadow-lg mb-8">🎨 Художник выбирает слово...</h2>
								<div className="w-24 h-24 border-8 border-white border-t-transparent rounded-full animate-spin mx-auto opacity-80" />
							</div>
						)}

						{phase === "countdown" && <CountdownDisplay />}

						{phase === "result" && (
							<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-fade-in rounded-3xl border border-white/10">
								<h2 className="text-7xl font-black text-white mb-6 drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
									{roundWinner ? "🎉 РАУНД ЗАВЕРШЕН!" : "⏰ ВРЕМЯ ВЫШЛО!"}
								</h2>
								<div className="bg-white/10 px-12 py-6 rounded-2xl mb-12 border border-white/20">
									<p className="text-2xl text-indigo-200 uppercase tracking-widest text-center mb-2">Загаданное слово</p>
									<p className="text-6xl text-yellow-400 font-black uppercase text-center drop-shadow-lg">{currentWord || "???"}</p>
								</div>

								{roundWinner ? (
									<div className="flex flex-col items-center animate-bounce-in">
										<div className="relative">
											<div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
											<img src={roundWinner.avatar} className="w-40 h-40 rounded-full border-8 border-yellow-400 shadow-2xl relative z-10 bg-white" alt="win" />
											<div className="absolute -bottom-4 -right-4 bg-yellow-400 text-black font-black text-2xl px-4 py-1 rounded-full border-4 border-slate-900 z-20">WINNER</div>
										</div>
										<p className="text-5xl text-white font-bold mt-6">{roundWinner.name}</p>
										<p className="text-3xl text-green-400 font-mono font-bold mt-2 text-shadow">+100 PTS</p>
									</div>
								) : (
									<div className="text-5xl text-slate-400 font-bold opacity-70">Никто не угадал 😢</div>
								)}
							</div>
						)}

						{phase === "drawing" && (
							<div className="w-full h-full max-w-[1800px] flex gap-6 p-4 animate-fade-in items-stretch">
								<div className="flex-[3] bg-white rounded-3xl shadow-2xl overflow-hidden relative border-[12px] border-slate-800 ring-4 ring-indigo-500/30 flex flex-col">
									<div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
										<div className="bg-slate-800 text-white px-8 py-3 rounded-full font-mono text-xl tracking-widest border-2 border-white/20 shadow-xl flex items-center gap-3">
											<HiPencil className="w-6 h-6 text-yellow-400 animate-pulse" />
											<span className="font-bold">{players.find(p => p.userId === currentArtistId)?.name}</span>
											<span className="text-slate-400">рисует</span>
										</div>
									</div>
									<div className="flex-1 bg-white relative">
										<CanvasBoard isArtist={false} />
									</div>
								</div>

								<div className="flex-1 min-w-[350px] max-w-[450px] flex flex-col gap-4">
									<div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-2xl flex flex-col gap-3">
										<div className="flex justify-between items-center text-white">
											<span className="text-sm font-bold uppercase tracking-widest text-slate-400">Раунд</span>
											<span className="text-2xl font-black">{round} / 10</span>
										</div>

										<div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden relative">
											<div
												className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000 linear"
												style={{ width: `${(time / 90) * 100}%` }}
											/>
										</div>
										<div className="flex items-center gap-2 text-yellow-400 font-mono text-xl font-bold self-end">
											<HiClock className="w-6 h-6" />
											{time}s
										</div>
									</div>

									<div className="flex-1 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
										<div className="bg-white/5 p-4 text-center border-b border-white/5 flex justify-between items-center">
											<span className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
												💬 Чат комнаты
											</span>
											<span className="text-xs text-slate-400 font-mono">LIVE</span>
										</div>
										<div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
											{(messages || []).map((m: any) => (
												<ChatMessageItem key={m.id} msg={m} />
											))}
											<div ref={chatEndRef} />
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{gameStatus === "waiting" && (
				<div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border-t-4 border-secondary rounded-t-3xl p-6 flex flex-col items-center justify-center gap-2 shadow-2xl mt-auto z-10 animate-slide-up -mb-4 shrink-0">
					<p className="text-slate-400 text-lg font-medium mb-0 uppercase tracking-widest">Присоединяйся к игре со смартфона</p>
					<p className="text-4xl md:text-6xl font-black text-white tracking-wide drop-shadow-lg">doodl.taskov1ch.xyz</p>
				</div>
			)}
		</div>
	);
};