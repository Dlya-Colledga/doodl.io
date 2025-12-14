import { useEffect, useRef } from 'react';
import { Howl } from 'howler';

export const useMenuMusic = (enabled: boolean = true) => {
	const introRef = useRef<Howl | null>(null);
	const loopRef = useRef<Howl | null>(null);

	useEffect(() => {
		if (!enabled) return;

		// Инициализация Loop (основная тема)
		loopRef.current = new Howl({
			src: ['/sounds/menu/loop.ogg'],
			loop: true,
			volume: 0.5,
			preload: true,
		});

		// Инициализация Intro (вступление)
		introRef.current = new Howl({
			src: ['/sounds/menu/intro.ogg'],
			volume: 0.5,
			preload: true,
			onend: () => {
				// Как только интро закончилось, играет луп
				if (loopRef.current) {
					loopRef.current.play();
				}
			},
		});

		// Запуск
		introRef.current.play();

		// Очистка при размонтировании (уход из меню)
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