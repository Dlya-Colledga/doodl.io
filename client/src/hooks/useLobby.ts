import { useEffect, useState } from 'react';
import { socket } from '../socket';

interface Player {
	id: string;
	name: string;
	avatar: string;
	score: number;
}

export const useLobby = () => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isConnected, setIsConnected] = useState(false);

	useEffect(() => {
		// 1. Подключаемся
		socket.connect();

		// 2. Как только подключились, отправляем пароль хоста
		// В реальном проекте пароль лучше брать из .env или ввода пользователя
		const onConnect = () => {
			console.log('Connected to server');
			socket.emit('host_login', 'SECRET_TASK_PASS');
		};

		const onHostSuccess = (data: { players: Player[] }) => {
			setIsConnected(true);
			setPlayers(data.players);
			console.log('Host registered successfully');
		};

		const onUpdatePlayers = (updatedPlayers: Player[]) => {
			setPlayers(updatedPlayers);
		};

		socket.on('connect', onConnect);
		socket.on('host_success', onHostSuccess);
		socket.on('update_players', onUpdatePlayers);

		// Тестовая заглушка: добавляем бота через 3 секунды, чтобы ты увидел интерфейс
		// (УДАЛИ ЭТО ПОТОМ)
		setTimeout(() => {
			socket.emit('player_join', { name: 'Test Player', avatar: '🤖' });
		}, 3000);

		return () => {
			socket.off('connect', onConnect);
			socket.off('host_success', onHostSuccess);
			socket.off('update_players', onUpdatePlayers);
			socket.disconnect();
		};
	}, []);

	return { players, isConnected };
};