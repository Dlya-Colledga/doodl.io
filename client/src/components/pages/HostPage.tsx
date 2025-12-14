import React from 'react';
import { Navigate } from 'react-router-dom'; // Импортируем редирект
import { HiSpeakerWave, HiSpeakerXMark, HiQrCode, HiExclamationTriangle } from "react-icons/hi2";
import { PlayerGrid } from '../menu/PlayerGrid';
import { useHost } from '../../hooks/useHost';
import { useMenuMusic } from '../../hooks/useMenuMusic';
import { Button } from '../ui/Button';

const BouncingLetter = ({ char, index, isSecondary = false }: { char: string; index: number; isSecondary?: boolean }) => (
	<span
		className={`inline-block animate-wave ${isSecondary ? 'text-secondary' : 'text-white'}`}
		style={{ animationDelay: `${index * 0.1}s` }}
	>
		{char}
	</span>
);

export const HostPage: React.FC = () => {
	// 1. ЗАЩИТА: Проверяем, откуда открыт сайт
	const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

	// Если это телефон (IP адрес) — сразу кидаем в Лобби, не загружая логику Хоста
	if (!isLocal) {
		return <Navigate to="/lobby" replace />;
	}

	// --- Дальше идет обычная логика Хоста ---

	const [musicEnabled, setMusicEnabled] = React.useState(false);
	const { players, isConnected, gameStatus, startGame } = useHost();

	useMenuMusic(musicEnabled);

	return (
		<div className="flex flex-col items-center min-h-screen p-4 z-10 relative w-full pt-12 overflow-hidden bg-gradient-to-b from-indigo-500 to-purple-700">
			<div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

			{/* Кнопка Музыки */}
			<button
				onClick={() => setMusicEnabled(!musicEnabled)}
				className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 transition-colors"
			>
				{musicEnabled ? <HiSpeakerWave className="w-8 h-8" /> : <HiSpeakerXMark className="w-8 h-8 text-white/50" />}
			</button>

			{/* ТАЙТЛ */}
			<div className="text-center relative select-none mb-8">
				<div
					className="absolute -right-12 -top-6 animate-wave hidden md:block text-secondary drop-shadow-lg"
					style={{ animationDelay: '0.6s' }}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="black" strokeWidth="1.2" style={{ paintOrder: 'stroke fill' }} className="w-16 h-16 rotate-12">
						<path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
					</svg>
				</div>

				<h1 className="text-6xl md:text-8xl font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] stroke-black text-stroke-3 flex items-center justify-center gap-1">
					{"Doodl".split("").map((char, i) => <BouncingLetter key={i} char={char} index={i} />)}
					{".io".split("").map((char, i) => <BouncingLetter key={`io-${i}`} char={char} index={i + 5} isSecondary />)}
				</h1>
			</div>

			{/* Сетка игроков */}
			<div className="flex-1 w-full flex flex-col items-center justify-start min-h-[300px] z-10">

				{gameStatus === 'waiting' && players.length > 0 && (
					<div className="mb-6 animate-bounce-in">
						<Button
							size="lg"
							variant="secondary"
							onClick={startGame}
							className="text-2xl px-12 py-4 shadow-[0_0_30px_rgba(251,177,60,0.4)] border-4 border-white/20"
						>
							Начать Игру 🚀
						</Button>
					</div>
				)}

				{gameStatus === 'playing' && (
					<div className="mb-6 bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse">
						Игра идет! Новые подключения закрыты.
					</div>
				)}
				<PlayerGrid players={players} />
			</div>

			{/* Футер */}
			<div className="w-full max-w-3xl bg-slate-900/80 backdrop-blur-xl border-t-4 border-secondary rounded-t-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl mt-auto z-10 animate-slide-up">
				<div className="text-center md:text-left">
					<p className="text-slate-400 text-lg font-medium mb-1 uppercase tracking-widest">Присоединяйся к игре</p>
					<p className="text-4xl font-black text-white tracking-wide">
						{/* Динамически показываем IP, чтобы пользователю было проще */}
						{window.location.hostname}:5173
					</p>
				</div>
				<div className="hidden md:flex items-center gap-4 bg-white/10 p-3 rounded-xl">
					<HiQrCode className="w-12 h-12 text-white" />
				</div>
			</div>
		</div>
	);
};