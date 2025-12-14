import { useEffect, useRef } from "react";
import { Howl } from "howler";

interface GameSoundProps {
	phase: string;
	status: string;
	isWin?: boolean;
	enableMusic?: boolean;
}

export const useGameSound = ({ phase, status, isWin, enableMusic = true }: GameSoundProps) => {
	const preMusicRef = useRef<Howl | null>(null);
	const loopMusicRef = useRef<Howl | null>(null);
	const timerSfxRef = useRef<Howl | null>(null);
	const victorySfxRef = useRef<Howl | null>(null);
	const defeatSfxRef = useRef<Howl | null>(null);

	useEffect(() => {
		preMusicRef.current = new Howl({ src: ["/sounds/game/pre.mp3"], loop: true, volume: 0 });
		loopMusicRef.current = new Howl({ src: ["/sounds/game/loop.mp3"], loop: true, volume: 0 });

		timerSfxRef.current = new Howl({ src: ["/sounds/game/timer.mp3"], volume: 0.8 });
		victorySfxRef.current = new Howl({ src: ["/sounds/game/victory.mp3"], volume: 0.6 });
		defeatSfxRef.current = new Howl({ src: ["/sounds/game/defeat.mp3"], volume: 0.6 });

		return () => {
			Howler.unload();
		};
	}, []);

	useEffect(() => {
		if (status === "waiting") {
			preMusicRef.current?.stop();
			loopMusicRef.current?.stop();
			return;
		}

		if (enableMusic) {
			if (phase === "roulette" || phase === "choosing") {
				if (loopMusicRef.current?.playing()) {
					loopMusicRef.current.fade(0.6, 0, 1000);
					setTimeout(() => loopMusicRef.current?.stop(), 1000);
				}
				if (!preMusicRef.current?.playing()) {
					preMusicRef.current?.play();
					preMusicRef.current?.fade(0, 0.6, 2000);
				}
			}

			if (phase === "drawing") {
				if (preMusicRef.current?.playing()) {
					preMusicRef.current.fade(0.6, 0, 2000);
					setTimeout(() => preMusicRef.current?.stop(), 2000);
				}
				if (!loopMusicRef.current?.playing()) {
					loopMusicRef.current?.play();
					loopMusicRef.current?.fade(0, 0.6, 2000);
				}
			}
		}

		if (phase === "countdown") {
			timerSfxRef.current?.play();
		}

		if (phase === "result") {
			if (enableMusic) {
				loopMusicRef.current?.stop();
				preMusicRef.current?.stop();
			}

			if (isWin) {
				victorySfxRef.current?.play();
			} else {
				defeatSfxRef.current?.play();
			}
		}

	}, [phase, status, isWin, enableMusic]);
};