export interface Player {
	userId: string;
	socketId: string;
	name: string;
	avatar: string;
	score: number;
	isOnline: boolean;
}

export interface ChatMessage {
	id: string;
	author: string;
	text: string;
}