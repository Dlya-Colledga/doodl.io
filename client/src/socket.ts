import { io } from "socket.io-client";

const getSocketUrl = () => {
	const { hostname } = window.location;
	return `http://${hostname}:3001`;
};

export const socket = io(getSocketUrl(), {
	autoConnect: false
});