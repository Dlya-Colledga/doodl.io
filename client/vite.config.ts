import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			// Все запросы на /api прокидываются на бэк
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
			},
			// Прокси для вебсокетов (если нужно)
			'/socket.io': {
				target: 'http://localhost:3001',
				ws: true,
			},
		},
	},
})