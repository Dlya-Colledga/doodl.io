import React, { useState } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import { Button } from '../ui/Button';
import { socket } from '../../socket';
import { HiWifi } from "react-icons/hi2"; // Импорт иконки

export const PlayerLobby: React.FC = () => {
	const [nickname, setNickname] = useState('');
	// Достаем ping из хука
	const { joined, error, joinGame, playerData, ping } = usePlayer();
	const isConnected = socket.connected;

	if (joined) {
		return (
			<div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-center text-white relative">

				{/* Пинг игрока в углу */}
				<div className="absolute top-4 right-4 flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
					<span className="font-mono text-sm font-bold">{ping}ms</span>
					<HiWifi className="w-5 h-5" />
				</div>

				<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 animate-bounce">
					{playerData?.avatar || '😎'}
				</div>
				<h1 className="text-3xl font-bold mb-2">Ты в игре!</h1>
				<p className="text-xl font-bold">{playerData?.name}</p>
				<p className="text-indigo-200 mt-2">Смотри на главный экран...</p>
			</div>
		);
	}

	// ... (форма входа, можно тоже добавить пинг в угол) ...
	return (
		<div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative">
			{/* Индикатор в углу */}
			<div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
				{isConnected && <span className="mr-1">{ping}ms</span>}
				<div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
				{isConnected ? 'ONLINE' : 'OFFLINE'}
			</div>

			{/* ... остальная разметка формы ... */}
			<div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl">
				{/* ... */}
				<input
					type="text"
					value={nickname}
					onChange={(e) => setNickname(e.target.value)}
					placeholder="Введи имя..."
					className="w-full text-2xl font-bold text-slate-900 bg-slate-100 border-2 border-slate-200 rounded-xl px-4 py-3 mb-2" // Чуть поправил стили
					maxLength={12}
				/>
				{/* ... */}
				<Button
					size="lg"
					className="w-full mt-2"
					onClick={() => joinGame(nickname)}
					disabled={!isConnected}
				>
					{isConnected ? 'Войти' : 'Подключение...'}
				</Button>
			</div>
		</div>
	);
};