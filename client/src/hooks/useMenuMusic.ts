import { useEffect, useRef } from "react";
import { Howl } from "howler";

export const useMenuMusic = (enabled: boolean = true) => {
	const introRef = useRef<Howl | null>(null);
	const loopRef = useRef<Howl | null>(null);

	useEffect(() => {
		if (!enabled) return;

		loopRef.current = new Howl({
			src: ["/sounds/menu/loop.ogg"],
			loop: true,
			volume: 0.5,
			preload: true,
		});

		introRef.current = new Howl({
			src: ["/sounds/menu/intro.ogg"],
			volume: 0.5,
			preload: true,
			onend: () => {
				if (loopRef.current) {
					loopRef.current.play();
				}
			},
		});

		introRef.current.play();

		return () => {
			introRef.current?.stop();
			loopRef.current?.stop();
		};
	}, [enabled]);

	const toggleMute = (mute: boolean) => {
		Howler.mute(mute);
	};

	return { toggleMute };
};