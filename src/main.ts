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

const activeView = stateManager.getState().ui.activeView;

const app = document.getElementById('app');



if (activeView === 'garage') {
    console.log(`current active-view: ${activeView}`);

    (garageView.mount(app!))

} else {
    winnersView.mount(app!)
}


