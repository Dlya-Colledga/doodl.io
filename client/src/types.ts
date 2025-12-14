export interface Player {
	userId: string;
	socketId: string;
	name: string;
	avatar: string;
	score: number;
	isOnline: boolean;
	ping?: number;
	lastHeartbeat?: number;
}

export interface ChatMessage {
	id: string;
	author: string;
	avatar: string;
	text: string;
	isSystem?: boolean;
}

export interface Point {
	x: number;
	y: number;
	color: string;
	width: number;
	type: "start" | "line" | "end";
}