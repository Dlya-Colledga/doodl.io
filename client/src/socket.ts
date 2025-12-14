import { io } from "socket.io-client";

const getSocketUrl = () => {
	if (import.meta.env.PROD) {
		return undefined;
	}

	const { hostname } = window.location;
	return `http://${hostname}:3001`;
};

export const socket = io(getSocketUrl(), {
	autoConnect: false
});