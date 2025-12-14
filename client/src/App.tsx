import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HostPage } from "./components/pages/HostPage";
import { PlayerLobby } from "./components/pages/PlayerLobby";

function App() {
	return (
		<BrowserRouter>
			<div className="fixed bottom-2 right-2 z-[9999] opacity-50 pointer-events-none text-right">
				<p className="text-[15px] text-white/80 font-mono bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
					⚠️ САЙТ НЕСТАБИЛЕН ⚠️
					<br />
					СДЕЛАН ДЛЯ МОДУЛЯ ЗА 1 ДЕНЬ
				</p>
			</div>

			<Routes>
				<Route path="/" element={<HostPage />} />
				<Route path="/lobby" element={<PlayerLobby />} />
				<Route path="*" element={<Navigate to="/lobby" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;