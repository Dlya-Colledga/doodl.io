import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HostPage } from './components/pages/HostPage';
import { PlayerLobby } from './components/pages/PlayerLobby';

function App() {
	return (
		<BrowserRouter>
			<Routes>
				{/* Главная страница (для ПК/ТВ) */}
				<Route path="/" element={<HostPage />} />

				{/* Страница для игроков (с телефона) */}
				<Route path="/lobby" element={<PlayerLobby />} />

				{/* Любые другие пути кидаем в лобби (или на 404) */}
				<Route path="*" element={<Navigate to="/lobby" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;