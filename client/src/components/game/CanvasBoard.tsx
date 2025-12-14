import React, { useEffect, useRef, useState } from "react";
import { socket } from "../../socket";
import { HiArrowUturnLeft, HiArrowUturnRight, HiTrash } from "react-icons/hi2";

interface CanvasBoardProps {
	isArtist: boolean;
	className?: string;
}

export const CanvasBoard: React.FC<CanvasBoardProps> = ({ isArtist, className }) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [color, setColor] = useState("#000000");
	const [width, setWidth] = useState(5);
	const [canvasSize, setCanvasSize] = useState(0);

	const historyRef = useRef<any[]>([]);
	const isDrawingRef = useRef(false);

	useEffect(() => {
		const updateSize = () => {
			if (!containerRef.current) return;
			const { clientWidth, clientHeight } = containerRef.current;
			const size = Math.min(clientWidth, clientHeight);
			setCanvasSize(size);
		};

		updateSize();
		window.addEventListener("resize", updateSize);
		return () => window.removeEventListener("resize", updateSize);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || canvasSize === 0) return;

		canvas.width = 1000;
		canvas.height = 1000;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		const drawStep = (data: any) => {
			const { x, y, color: c, width: w, type } = data;
			ctx.strokeStyle = c;
			ctx.lineWidth = w * 2;

			if (type === "start") {
				ctx.beginPath();
				ctx.moveTo(x * 1000, y * 1000);
			} else if (type === "line") {
				ctx.lineTo(x * 1000, y * 1000);
				ctx.stroke();
			} else {
				ctx.closePath();
			}
		};

		ctx.clearRect(0, 0, 1000, 1000);
		historyRef.current.forEach(step => drawStep(step));

		const onDrawLine = (data: any) => {
			historyRef.current.push(data);
			drawStep(data);
		};

		const onHistoryUpdate = (fullHistory: any[]) => {
			historyRef.current = fullHistory;
			ctx.clearRect(0, 0, 1000, 1000);
			fullHistory.forEach(step => drawStep(step));
		};

		const onClear = () => {
			historyRef.current = [];
			ctx.clearRect(0, 0, 1000, 1000);
		};

		socket.on("draw_line", onDrawLine);
		socket.on("canvas_history_update", onHistoryUpdate);
		socket.on("canvas_clear", onClear);

		socket.emit("request_canvas_history");

		return () => {
			socket.off("draw_line", onDrawLine);
			socket.off("canvas_history_update", onHistoryUpdate);
			socket.off("canvas_clear", onClear);
		};
	}, [canvasSize]);

	const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
		const canvas = canvasRef.current;
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();

		let clientX, clientY;
		if ("touches" in e) {
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = (e as React.MouseEvent).clientX;
			clientY = (e as React.MouseEvent).clientY;
		}

		return {
			x: (clientX - rect.left) / rect.width,
			y: (clientY - rect.top) / rect.height
		};
	};

	const startDrawing = (e: any) => {
		if (!isArtist) return;
		isDrawingRef.current = true;
		const { x, y } = getCoords(e);
		const data = { x, y, color, width, type: "start" };

		historyRef.current.push(data);
		const ctx = canvasRef.current?.getContext("2d");
		if (ctx) { ctx.beginPath(); ctx.moveTo(x * 1000, y * 1000); ctx.strokeStyle = color; ctx.lineWidth = width * 2; }

		socket.emit("draw_line", data);
	};

	const draw = (e: any) => {
		if (!isArtist || !isDrawingRef.current) return;
		e.preventDefault();
		const { x, y } = getCoords(e);
		const data = { x, y, color, width, type: "line" };

		historyRef.current.push(data);
		const ctx = canvasRef.current?.getContext("2d");
		if (ctx) { ctx.lineTo(x * 1000, y * 1000); ctx.stroke(); }

		socket.emit("draw_line", data);
	};

	const stopDrawing = () => {
		if (!isArtist || !isDrawingRef.current) return;
		isDrawingRef.current = false;
		socket.emit("draw_line", { x: 0, y: 0, color, width, type: "end" });
	};

	const handleUndo = () => socket.emit("canvas_undo");
	const handleRedo = () => socket.emit("canvas_redo");
	const handleClear = () => socket.emit("canvas_clear");

	return (
		<div ref={containerRef} className={`w-full h-full flex items-center justify-center bg-slate-900 ${className}`}>

			<div
				style={{ width: canvasSize, height: canvasSize }}
				className="relative bg-white shadow-2xl"
			>
				<canvas
					ref={canvasRef}
					className="w-full h-full touch-none cursor-crosshair block"
					onMouseDown={startDrawing}
					onMouseMove={draw}
					onMouseUp={stopDrawing}
					onMouseLeave={stopDrawing}
					onTouchStart={startDrawing}
					onTouchMove={draw}
					onTouchEnd={stopDrawing}
				/>
			</div>

			{isArtist && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md p-2 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10 z-10 animate-slide-up">

					<div className="flex gap-1 bg-black/20 p-1 rounded-xl">
						{["#000000", "#ef4444", "#22c55e", "#3b82f6", "#eab308"].map((c) => (
							<button
								key={c}
								onClick={() => setColor(c)}
								className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-white scale-110" : "border-transparent hover:scale-110"}`}
								style={{ backgroundColor: c }}
							/>
						))}
					</div>

					<div className="w-px h-6 bg-white/20" />

					<div className="flex gap-1">
						{[5, 15].map((s) => (
							<button key={s} onClick={() => setWidth(s)} className={`w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700 ${width === s ? "ring-2 ring-indigo-500" : ""}`}>
								<div className="bg-white rounded-full" style={{ width: s / 2 + 2, height: s / 2 + 2 }} />
							</button>
						))}
					</div>

					<div className="w-px h-6 bg-white/20" />

					<div className="flex gap-1">
						<button onClick={handleUndo} className="p-2 text-white bg-slate-700 rounded-lg hover:bg-slate-600 active:scale-95">
							<HiArrowUturnLeft className="w-5 h-5" />
						</button>
						<button onClick={handleRedo} className="p-2 text-white bg-slate-700 rounded-lg hover:bg-slate-600 active:scale-95">
							<HiArrowUturnRight className="w-5 h-5" />
						</button>
						<button onClick={handleClear} className="p-2 text-red-400 bg-slate-700 rounded-lg hover:bg-red-900/50 active:scale-95 ml-1">
							<HiTrash className="w-5 h-5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
};