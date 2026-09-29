# Telegram Chat · GREEN-API

Веб-интерфейс для отправки и получения текстовых сообщений Telegram через GREEN-API.

## Возможности

- подключение по `apiUrl`, `idInstance` и `apiTokenInstance`;
- проверка Telegram-аккаунта по номеру телефона;
- отправка текстовых сообщений;
- получение входящих сообщений через HTTP API;
- адаптивный интерфейс для компьютера и телефона.

## Локальный запуск

Требуется Node.js 18.18 или новее. Рекомендуемая версия указана в `.nvmrc`.

```bash
nvm use
npm install
npm run dev
```

После запуска откройте адрес, который покажет Vite (обычно `http://localhost:5173`).

Для production-сборки:

```bash
npm run build
npm run preview
```

## GitHub Pages

Адрес сайта после публикации: https://d27o.github.io/green-api/

В настройках репозитория откройте **Settings → Pages → Build and deployment**
и выберите **Source: GitHub Actions**. Workflow `.github/workflows/deploy.yml`
проверяет код, собирает приложение и публикует `dist` при каждом push в `main`.
Его также можно запустить вручную через **Actions → Deploy to GitHub Pages → Run workflow**.

Для размещения в подпапке репозитория в `vite.config.ts` задан `base: '/green-api/'`.

## Подготовка GREEN-API

1. Создайте и авторизуйте Telegram-инстанс в личном кабинете GREEN-API.
2. В настройках инстанса включите получение уведомлений о входящих сообщениях.
3. Оставьте поле Webhook URL пустым, так как приложение получает уведомления через HTTP API.
4. Скопируйте `apiUrl`, `idInstance` и `apiTokenInstance` в форму входа.

Параметры доступа хранятся только в памяти открытой вкладки и удаляются после выхода или перезагрузки страницы.
