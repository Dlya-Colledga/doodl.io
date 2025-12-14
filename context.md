# Project Context: Gartic Show Clone (Модульная работа)

## 1. Обзор проекта
Разработка веб-приложения, клона игры "Gartic Show".
**Цель:** Демонстрация работы WebSockets (синхронное рисование/чат), AJAX и Node.js бэкенда.

## 2. Технический стек
- **Frontend:** React + TypeScript + Vite.
- **Backend:** Node.js + Express + Socket.io (JavaScript).
- **Архитектура:** Monorepo. Запуск через `concurrently` из корня.
- **Стилизация:** (пока не определено, предположительно CSS modules или Tailwind/SCSS).
- **Аудио движок:** Howler.js.

## 3. Структура проекта
```text
root/
├── package.json (скрипт "serve" запускает и клиент, и сервер)
├── context.md (этот файл)
├── client/ (Vite + React + TS)
│   ├── public/
│   │   └── sounds/
│   │       └── menu/
│   │           ├── intro.ogg
│   │           └── loop.ogg
│   └── src/
└── server/ (Express + Socket.io)
    └── index.js
```

## 4. Реализация Аудио (Sound Manager)

Используем библиотеку `howler` (или `react-howler`) для управления звуком.

### Ассеты:

В наличии есть фоновая музыка для меню, разделенная на две части:

1.  `intro.ogg` — вступление (играет 1 раз).
2.  `loop.ogg` — основная тема (зациклена).

### Логика воспроизведения (Gapless playback):

Необходимо реализовать очередь воспроизведения:

1.  Запускается `menu_intro`.
2.  По событию `onend` (конец интро) моментально запускается `menu_loop`.
3.  `menu_loop` имеет параметр `loop: true`.

**Примерная логика (Howler):**

```ts
import { Howl } from 'howler';

const menuLoop = new Howl({
  src: ['/sounds/menu/loop.ogg'],
  loop: true,
  volume: 0.5
});

const menuIntro = new Howl({
  src: ['/sounds/menu/intro.ogg'],
  volume: 0.5,
  onend: function() {
    menuLoop.play();
  }
});

// Запуск
menuIntro.play();
```

## 5\. Текущий статус

  - [x] Инициализация репозитория.
  - [x] Настройка `concurrently` для одновременного запуска.
  - [x] Базовый сервер (Express + Socket.io).
  - [ ] Установка `howler` (`npm install howler` в папке client).
  - [ ] Настройка прокси в Vite (уже есть в конфиге).
  - [ ] Реализация механики рисования (Canvas).

## 6\. Команды

  - Запуск всего проекта: `npm run serve` (из корня).
  - Бэкенд порт: 3001.
  - Фронтенд порт: 5173.