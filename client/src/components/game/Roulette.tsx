import React, { useEffect, useRef, useState } from "react";
import { Howl } from "howler";

interface Player {
	userId: string;
	name: string;
	avatar: string;
}

interface RouletteProps {
	players: Player[];
	winnerId: string;
	duration: number;
	onComplete: () => void;
}

export const Roulette: React.FC<RouletteProps> = ({ players: incomingPlayers, winnerId, duration, onComplete }) => {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);
	const [isFinished, setIsFinished] = useState(false);

	const [players] = useState(incomingPlayers);

	const soundRef = useRef<Howl | null>(null);

	useEffect(() => {
		soundRef.current = new Howl({ src: ["/sounds/roulette/sound.mp3"], volume: 0.4 });
		return () => {
			soundRef.current?.unload();
		};
	}, []);

	useEffect(() => {
		if (players.length === 0) return;

		const winnerIndex = players.findIndex(p => p.userId === winnerId);
		if (winnerIndex === -1) {
			onComplete();
			return;
		}

		let startTime = Date.now();
		let speed = 50;
		let timeoutId: number;
		let currentIndex = 0;

		const nextTick = () => {
			const elapsed = Date.now() - startTime;
			const progress = elapsed / duration;

			if (progress < 0.7) {
				speed *= 1.05;
			} else {
				speed *= 1.15;
			}

			let nextIndex;
			do {
				nextIndex = Math.floor(Math.random() * players.length);
			} while (nextIndex === currentIndex && players.length > 1);

			currentIndex = nextIndex;

			if (elapsed >= duration) {
				setActiveIndex(winnerIndex);
				setIsFinished(true);
				soundRef.current?.rate(1.5);
				soundRef.current?.play();

				setTimeout(onComplete, 2000);
				return;
			}

			setActiveIndex(currentIndex);

			soundRef.current?.rate(0.9 + Math.random() * 0.2);
			soundRef.current?.play();

			timeoutId = window.setTimeout(nextTick, speed);
		};

		nextTick();

		return () => clearTimeout(timeoutId);

	}, [winnerId, duration, onComplete, players]);

	return (
		<div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
			<h2 className="text-4xl md:text-6xl text-white font-black mb-8 animate-bounce drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
				{isFinished ? "🎉 ХУДОЖНИК ВЫБРАН! 🎉" : "КТО ЖЕ РИСУЕТ?"}
			</h2>

			<div className="flex flex-wrap justify-center gap-4 max-w-5xl">
				{players.map((player, i) => {
					const isActive = i === activeIndex;
					const isWinner = isFinished && i === activeIndex;

					return (
						<div
							key={player.userId}
							className={`
								relative transition-all duration-100 ease-out
								flex flex-col items-center justify-center
								w-32 h-32 md:w-40 md:h-40 rounded-3xl
								${isActive
									? "scale-110 z-10 bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.6)] rotate-2"
									: "scale-100 bg-white/10 opacity-60 grayscale"
								}
								${isWinner ? "scale-125 bg-green-500 shadow-[0_0_50px_rgba(34,197,94,0.8)] rotate-0 animate-pulse" : ""}
							`}
						>
							<img
								src={player.avatar}
								alt={player.name}
								className={`
									w-20 h-20 md:w-24 md:h-24 rounded-full bg-white object-cover border-4
									${isActive ? "border-slate-900" : "border-transparent"}
								`}
							/>
							<span className={`
								mt-2 font-bold text-sm md:text-base truncate max-w-[90%] px-2 rounded-full
								${isActive ? "text-slate-900 bg-white/20" : "text-white"}
							`}>
								{player.name}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};