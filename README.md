🛠️ Technology Stack

**Core Technologies**
TypeScript — типобезопасность, интерфейсы, строгая типизация
Vanilla JS (No Frameworks) — чистый DOM API, отсутствие внешних зависимостей
Vite — сборка проекта, быстрая разработка

🏗️**Architecture & Patterns**
Flux-like State Management — собственный StateManager для централизованного хранения состояния
Event-Driven Architecture — EventBus для слабосвязанной коммуникации между модулями
Service Layer — разделение бизнес-логики (GarageService, RaceService, WinnersService, UIService)
Component-Based UI — переиспользуемые компоненты (Button, Input, Modal, CarComponent)
Repository Pattern — API слой с наследованием от BaseApi

⚡**Async Patterns**
Promise.race() — гонка между анимацией и drive API (определение победителя/поломки)
requestAnimationFrame — плавная 60fps анимация машин
Async/Await — работа с асинхронными API запросами
Parallel Requests — одновременный старт всех машин в гонке

**API & Data**
REST API — взаимодействие с JSON сервером (Garage, Winners, Engine endpoints)
Custom API Client — абстрактный BaseApi с обработкой заголовков и пагинацией
Mock API Support — возможность переключения на моковые данные

**State Management**
Immutable State Updates — неизменяемое обновление состояния
Reactive Subscriptions — подписка View на изменения State
Typed State Interfaces — полная типизация AppState

**Key Features Implementation**
Dynamic Pagination — пагинация для Garage и Winners
Race Animation Synchronization — единый RAF loop для всех машин
Winner Detection — определение первого финишировавшего с минимальным временем
Car Generation — генерация 100 случайных машин
Sorting System — сортировка победителей по wins/time

**Styling**
CSS Modules / Vanilla CSS — компонентные стили
Responsive Design — адаптивная верстка
SVG Car Graphics — динамическая отрисовка машин с цветом

**Development & Quality**
ESLint — статический анализ кода
Prettier — форматирование
TypeScript Strict Mode — строгий режим TypeScript

📁**Project Structure**

src/
├── api/ # API клиенты (BaseApi, GarageApi, WinnersApi, EngineApi)
├── core/ # Ядро (EventBus, StateManager)
├── services/ # Бизнес-логика
├── views/ # Страницы (GarageView, WinnersView)
├── components/ # UI компоненты (Button, Input, Modal, CarComponent)
├── types/ # TypeScript интерфейсы и типы
└── styles/ # Глобальные стили

**Build & Deploy**
Vite — быстрая сборка и HMR
GitHub Pages / Netlify — деплой (по выбору)

🔑 **Key Technical Decisions**
Собственный StateManager вместо Redux — легковесность, полный контроль
EventBus для коммуникации — избежание prop drilling, слабая связанность
Promise.race() для гонки — элегантное решение для конкурентности
Единый RAF loop — синхронизация всех анимаций в массовой гонке
Типизация на 100% — все интерфейсы и типы вынесены отдельно
