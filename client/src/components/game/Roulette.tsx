import React, { useEffect, useRef, useState } from "react";

interface Player {
	userId: string;
	name: string;
	avatar: string;
}

interface RouletteProps {
	players: Player[];
	winnerId: string;
	duration: number; // ms
	onComplete: () => void;
}

export const Roulette: React.FC<RouletteProps> = ({ players, winnerId, duration, onComplete }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [offset, setOffset] = useState(0);
	const CARD_WIDTH = 120; // Ширина карточки
	const GAP = 16; // Отступ

	// Генерируем длинную ленту (повторяем игроков много раз)
	// Чтобы победитель оказался где-то в конце (например, на 75-й позиции)
	const REPEAT_COUNT = 20;
	const extendedPlayers = Array(REPEAT_COUNT).fill(players).flat();

	// Находим индекс победителя в последней трети ленты
	// Чтобы прокрутка была долгой
	const targetIndex = extendedPlayers.findLastIndex(p => p.userId === winnerId) - Math.floor(players.length * 2);

	useEffect(() => {
		// Запускаем анимацию с небольшой задержкой для плавности
		const timeout = setTimeout(() => {
			// Вычисляем смещение:
			// (индекс * ширина) - (половина экрана) + (половина карточки) + (рандомный сдвиг внутри карточки для реализма)
			const randomOffset = Math.floor(Math.random() * (CARD_WIDTH - 20)) + 10;
			const targetOffset = (targetIndex * (CARD_WIDTH + GAP)) - (window.innerWidth / 2) + (CARD_WIDTH / 2);

			setOffset(targetOffset);
		}, 100);

		const completeTimeout = setTimeout(onComplete, duration + 1000);

		return () => {
			clearTimeout(timeout);
			clearTimeout(completeTimeout);
		};
	}, [winnerId]);

	return (
		<div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center">
			<h2 className="text-4xl text-white font-black mb-8 animate-pulse">ВЫБОР ХУДОЖНИКА...</h2>

			{/* Стрелка-указатель */}
			<div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[90px] z-20 drop-shadow-lg" />

			<div className="w-full overflow-hidden bg-slate-800 py-8 border-y-4 border-yellow-400 relative shadow-2xl">
				<div
					className="flex gap-4 px-[50vw]" // Начинаем с середины
					style={{
						transform: `translateX(-${offset}px)`,
						transition: `transform ${duration}ms cubic-bezier(0.1, 0.7, 0.1, 1)` // CS:GO easing
					}}
				>
					{extendedPlayers.map((player, i) => (
						<div
							key={i}
							className={`flex-shrink-0 w-[120px] h-[120px] bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-lg border-b-4 ${player.userId === winnerId ? 'border-indigo-500' : 'border-slate-300'}`}
						>
							<img src={player.avatar} alt="avatar" className="w-16 h-16 rounded-full bg-slate-100 mb-2" />
							<span className="font-bold text-slate-800 truncate w-full text-center text-sm">{player.name}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};