import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HostPage } from "./components/pages/HostPage";
import { PlayerLobby } from "./components/pages/PlayerLobby";

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<HostPage />} />

				<Route path="/lobby" element={<PlayerLobby />} />

				<Route path="*" element={<Navigate to="/lobby" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;