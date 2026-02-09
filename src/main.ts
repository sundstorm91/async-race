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
import './style.css';

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
const garageView = new GarageView(garageService, raceService, uiService, stateManager);
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
