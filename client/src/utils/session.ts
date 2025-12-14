export const getUserId = (): string => {
	const STORAGE_KEY = 'doodl_user_id';
	let userId = localStorage.getItem(STORAGE_KEY);

	if (!userId) {
		// Ручная генерация UUID (работает в любом браузере и на HTTP)
		userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
		localStorage.setItem(STORAGE_KEY, userId);
	}

	return userId;
};