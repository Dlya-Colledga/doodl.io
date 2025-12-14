import React from "react";
import { HiUser, HiSignalSlash, HiWifi } from "react-icons/hi2";
import { type Player } from "../../hooks/useHost";

interface PlayerGridProps {
	players: Player[];
}

const getPingColor = (ping: number = 0) => {
	if (ping < 80) return "text-green-400";
	if (ping < 150) return "text-yellow-400";
	return "text-red-500";
};

export const PlayerGrid: React.FC<PlayerGridProps> = ({ players }) => {
	if (players.length === 0) {
		return <div className="text-white font-medium animate-pulse">Ожидание игроков...</div>;
	}

	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl p-4">
			{players.map((player) => (
				<div
					key={player.userId}
					className={`
            relative p-4 flex flex-col items-center gap-2 transition-all duration-500 rounded-2xl
            ${player.isOnline
							? "animate-bounce-in"
							: "grayscale opacity-50 scale-95"
						}
          `}
				>
					<div className="absolute top-2 right-6 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
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

					<div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-xl relative overflow-hidden border-4 border-white/20">
						{player.avatar?.startsWith("http") ? (
							<img
								src={player.avatar}
								alt={player.name}
								className="w-full h-full object-cover"
							/>
						) : (
							player.avatar || <HiUser className="text-slate-900" />
						)}
					</div>

					<span className="text-white font-black text-xl tracking-wide truncate w-full text-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
						{player.name}
					</span>
				</div>
			))}
		</div>
	);
};