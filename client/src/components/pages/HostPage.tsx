import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { HiPencil, HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { PlayerGrid } from "../menu/PlayerGrid";
import { useHost } from "../../hooks/useHost";
import { useMenuMusic } from "../../hooks/useMenuMusic";
import { Button } from "../ui/Button";

// --- КОМПОНЕНТ ВИЗУАЛЬНОГО ТАЙМЕРА (Чтобы не зависало на 3) ---
const CountdownDisplay = () => {
	const [count, setCount] = useState(3);
	useEffect(() => {
		const interval = setInterval(() => {
			setCount((prev) => (prev > 1 ? prev - 1 : 1));
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="animate-bounce-in text-center">
			<h2 key={count} className="text-[12rem] font-black text-secondary leading-none drop-shadow-[0_10px_0_rgba(0,0,0,0.5)] animate-pop-in">
				{count}
			</h2>
			<p className="text-2xl text-white font-bold uppercase tracking-[1em]">Приготовьтесь</p>
		</div>
	);
};

const ChatMessageItem = ({ msg }: { msg: any }) => (
	<div className="flex items-start gap-3 mb-2 animate-fade-in-up">
		<img src={msg.avatar} className="w-8 h-8 rounded-full bg-white border border-slate-300" alt="av" />
		<div className="bg-white/90 px-3 py-2 rounded-r-xl rounded-bl-xl shadow-sm">
			<span className="font-bold text-xs text-indigo-600 block">{msg.author}</span>
			<span className="text-slate-800 font-medium leading-tight">{msg.text}</span>
		</div>
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
	const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

	if (!isLocal) {
		return <Navigate to="/lobby" replace />;
	}

	const [musicEnabled, setMusicEnabled] = React.useState(false);
	const { players, gameStatus, startGame, phase, messages } = useHost();

	const chatEndRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (messages && messages.length > 0) {
			chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	useMenuMusic(musicEnabled);

	return (
		<div className="flex flex-col items-center h-screen p-4 z-10 relative w-full pt-6 overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-700">
			<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

			<button
				onClick={() => setMusicEnabled(!musicEnabled)}
				className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors"
			>
				{musicEnabled ? <HiSpeakerWave className="w-8 h-8" /> : <HiSpeakerXMark className="w-8 h-8 text-white/50" />}
			</button>

			<div className={`text-center relative select-none shrink-0 transition-all duration-500 ${gameStatus === "playing" ? "mb-2 scale-75 origin-top" : "mb-8"}`}>
				<div className="absolute -right-12 -top-6 animate-wave hidden md:block text-secondary drop-shadow-lg" style={{ animationDelay: "0.6s" }}>
					<HiPencil className="w-16 h-16 rotate-12 text-secondary" stroke="black" strokeWidth="1.2" style={{ paintOrder: 'stroke fill' }} />
				</div>
				<h1 className="text-6xl md:text-8xl font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] stroke-black text-stroke-3 flex items-center justify-center gap-1">
					{"Doodl".split("").map((char, i) => <BouncingLetter key={i} char={char} index={i} />)}
					{".io".split("").map((char, i) => <BouncingLetter key={`io-${i}`} char={char} index={i + 5} isSecondary />)}
				</h1>
			</div>

			<div className="flex-1 w-full flex flex-col items-center justify-start min-h-0 overflow-y-auto z-10 scroll-smooth pb-4 no-scrollbar">
				{gameStatus === "waiting" && (
					<>
						{players.length > 0 && (
							<div className="mb-6 animate-bounce-in shrink-0">
								<Button size="lg" variant="secondary" onClick={startGame} className="text-2xl px-12 py-4 shadow-[0_0_30px_rgba(251,177,60,0.4)] border-4 border-white/20">
									Начать Игру 🚀
								</Button>
							</div>
						)}
						<PlayerGrid players={players} />
					</>
				)}

				{gameStatus === "playing" && (
					<div className="w-full h-full flex items-center justify-center relative">
						{phase === "choosing" && (
							<div className="animate-zoom-in text-center">
								<h2 className="text-5xl font-black text-white drop-shadow-lg mb-4">🎨 Художник выбирает слово...</h2>
								<div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto opacity-80" />
							</div>
						)}

						{/* ИСПОЛЬЗУЕМ НОВЫЙ КОМПОНЕНТ ТАЙМЕРА */}
						{phase === "countdown" && <CountdownDisplay />}

						{phase === "drawing" && (
							<div className="w-full h-full max-w-[1600px] flex gap-4 p-2 animate-fade-in items-stretch">
								<div className="flex-1 bg-white rounded-3xl shadow-2xl overflow-hidden relative border-8 border-indigo-900/20 min-h-[400px]">
									<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
										<p className="text-slate-300 text-4xl font-bold uppercase rotate-[-15deg]">Canvas Area</p>
									</div>
									<div className="absolute top-4 left-0 right-0 flex justify-center">
										<div className="bg-slate-800 text-white px-6 py-2 rounded-full font-mono text-xl tracking-widest border-2 border-white/20 shadow-lg">
											ИГРОК рисует слово
										</div>
									</div>
								</div>

								<div className="w-80 md:w-96 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col shadow-xl overflow-hidden shrink-0">
									<div className="bg-white/10 p-3 text-center border-b border-white/5">
										<span className="text-white font-bold uppercase tracking-wider text-sm">Чат комнаты</span>
									</div>
									<div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
										{messages && messages.map((m: any) => (
											<ChatMessageItem key={m.id} msg={m} />
										))}
										<div ref={chatEndRef} />
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{gameStatus === "waiting" && (
				<div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border-t-4 border-secondary rounded-t-3xl p-6 flex flex-col items-center justify-center gap-2 shadow-2xl mt-auto z-10 animate-slide-up -mb-4 shrink-0">
					<p className="text-slate-400 text-lg font-medium mb-0 uppercase tracking-widest">Присоединяйся к игре</p>
					<p className="text-4xl md:text-5xl font-black text-white tracking-wide">doodl.taskov1ch.xyz</p>
				</div>
			)}
		</div>
	);
};