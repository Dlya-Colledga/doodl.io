import React from 'react';
import { HiUser, HiSignalSlash, HiWifi } from "react-icons/hi2"; // Добавь HiWifi
import { type Player } from '../../hooks/useHost';

interface PlayerGridProps {
	players: Player[];
}

// Функция для определения цвета пинга
const getPingColor = (ping: number = 0) => {
	if (ping < 80) return 'text-green-400';
	if (ping < 150) return 'text-yellow-400';
	return 'text-red-500';
};

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players }) => {
	if (players.length === 0) {
		// ... заглушка ожидания ...
		return <div className="text-white">Ожидание...</div>;
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl p-4">
			{players.map((player) => (
				<div
					key={player.userId}
					className={`
            relative p-4 flex flex-col items-center gap-2 rounded-2xl border transition-all duration-500
            ${player.isOnline
							? 'bg-white/10 backdrop-blur-md border-white/20 animate-bounce-in'
							: 'bg-red-900/20 border-red-500/30 grayscale opacity-70 scale-95'}
          `}
				>
					{/* Индикатор связи */}
					<div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
						{!player.isOnline ? (
							<HiSignalSlash className="w-4 h-4 text-red-500 animate-pulse" />
						) : (
							<>
								<span className={`text-xs font-mono font-bold ${getPingColor(player.ping)}`}>
									{player.ping || 0}ms
								</span>
								<HiWifi className={`w-4 h-4 ${getPingColor(player.ping)}`} />
							</>
						)}
					</div>

					<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-lg relative">
						{player.avatar || <HiUser className="text-slate-900" />}
					</div>

					<span className="text-white font-bold text-lg truncate w-full text-center">
						{player.name}
					</span>
				</div>
			))}
		</div>
	);
};