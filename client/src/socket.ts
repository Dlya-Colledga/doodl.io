import { io } from 'socket.io-client';

// Определяем адрес сервера динамически
// Если сайт открыт как localhost, стучимся на localhost
// Если сайт открыт по IP (с телефона), стучимся по этому же IP
const getSocketUrl = () => {
	const { hostname } = window.location;
	// Порт сервера всегда 3001
	return `http://${hostname}:3001`;
};

export const socket = io(getSocketUrl(), {
	autoConnect: false
});