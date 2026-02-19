import { EngineApi, GarageApi, WinnersApi } from './api';
import { EventBus } from './core';
import { StateManager } from './core/state-manager';
import { GarageService } from './services/GarageService';
import { RaceService } from './services/RaceService';
import { UIService } from './services/UiService';
import { WinnerService } from './services/WinnersService';
import { type AppState, initialState } from './types';
import { GarageView } from './views/GarageView';
import { WinnersView } from './views/WinnersView';
import './styles/main.scss';
import { Modal } from './components/Modal/Modal';

// Инициализация зависимостей
const eventBus = new EventBus();
const stateManager = new StateManager<AppState>(initialState);
const garageApi = new GarageApi('http://localhost:3000');
const winnersApi = new WinnersApi('http://localhost:3000');
const engineApi = new EngineApi('http://localhost:3000');

// Создаём сервисы
const garageService = new GarageService(stateManager, eventBus, garageApi);
const winnersService = new WinnerService(stateManager, eventBus, winnersApi, garageApi);
const uiService = new UIService(stateManager, eventBus, garageApi, winnersApi);

const raceService = new RaceService(stateManager, eventBus, engineApi, winnersService, uiService);


// Создаём View
const garageView = new GarageView(garageService, raceService, uiService, stateManager, raceService);
const winnersView = new WinnersView(uiService, stateManager, winnersService);
const app = document.getElementById('app');

const initialView = initialState.ui.activeView;

// Храним текущую отображённую вью
let currentView: GarageView | WinnersView | null = null;

// При старте инициализируем
if (initialView === 'garage') {
    currentView = garageView;
    garageView.mount(app!);
} else {
    currentView = winnersView;
    winnersView.mount(app!);
}

// В обработчике события
eventBus.on('view:changed', (view) => {
    console.log('🔄 Переключаю с', currentView?.constructor.name, 'на', view);

    // 1. Демонтируем ТЕКУЩУЮ (ту, что сейчас висит в DOM)
    if (currentView) {
        currentView.unmount();
    }

    // 2. Монтируем НОВУЮ
    if (view === 'garage') {
        currentView = garageView;
        garageView.mount(app!);
    } else {
        currentView = winnersView;
        winnersView.mount(app!);
    }
});


    let currentModal: Modal | null = null;

    stateManager.subscribe((state) => {
    const winnerModal = state.ui.modals.winner;

    // Нет данных = ничего не делаем
    if (!winnerModal.data) return;

    // Создаем/обновляем модалку
    if (winnerModal.isOpen) {
        if (!currentModal) {
        // Создаем новую
        const content = document.createElement('div');
        content.innerHTML = `
            <div style="color: ${winnerModal.data.car.color}; font-weight: bold">
            🚗 ${winnerModal.data.car.name}
            </div>
            <div>⏱️ Time: ${winnerModal.data.time.toFixed(2)}s</div>
            <div>🏆 1st victory!</div>
        `;

        currentModal = new Modal({
            isOpen: true,
            title: '🏆 Winner!',
            onClose: () => uiService.hideWinnerModal(),
            children: [content],
        });
        }
        // Если модалка уже есть - можно обновить её контент
        // currentModal.update({ ... })
    }
    // Закрываем модалку
    else if (currentModal) {
        currentModal.close();
        currentModal = null;
    }
    });