import type { GarageApi } from "../api";
import { Button } from "../components/Button/Button";
import { CarComponent } from "../components/domain/CarComponent/CarComponent";
import { Input } from "../components/Input/Input";
import type { StateManager } from "../core/state-manager";
import type { GarageService } from "../services/GarageService";
import type { RaceService } from "../services/RaceService";
import type { UIService } from "../services/UiService";
import type { AppState, Car, RaceParticipant } from "../types";

interface IGarageView {
    mount(container: HTMLElement): void;
    unmount():void;
    render(): HTMLElement;
}
export class GarageView implements IGarageView {
    private prevCars: Car[] = [];
    private prevPageInfo = { page: 0, totalPages: 0 };
    private prevTotalCars = 0;
    private prevRaceParticipants: RaceParticipant[] = [];
    private root: HTMLDivElement;
    private unsubscribe: () => void;

    constructor(
        private garageApi: GarageApi,
        private garageService: GarageService,
        private engineService: RaceService,
        private uiService: UIService,
        private stateManager: StateManager<AppState>,
        private raceService: RaceService,
    ){
        this.root = document.createElement('div');
        this.root.className = 'garage-view';

        /* подписываемся на изменение стейта */

        this.unsubscribe = stateManager.subscribe(() => {
            console.log('🔄 [GarageView] Подписка сработала!', {
            activeView: this.stateManager.getState().ui.activeView,
            participantsCount: this.stateManager.getState().race.participants.length,
            timestamp: Date.now()
        });

            this.update()

        })
    }

    private renderHeader(): HTMLElement {
        const container = document.createElement('div');
        const counter = document.createElement('span');
        const title = document.createElement('div');
        title.textContent = 'Garage'

        container.className = 'header';
        counter.className = 'counter';

        const button = new Button({
            onClick: () => this.uiService.switchView('winners'),
            text: '🏆 Winners',
            type: 'primary',
        })

        const totalCars = this.stateManager.getState().garage.cars.length;
        counter.textContent = `Total cars: ${totalCars}`;

        container.appendChild(button.render())
        container.appendChild(counter);
        container.appendChild(title);

        return container;
    }

    private renderCreateForm(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'create-form';

    // Состояние формы (локальное для View)
    let carName = '';
    let carColor = '#ff0000';

    // Поле имени
    const nameInput = new Input({
        type: 'text',
        placeholder: 'Car name',
        value: carName,
        onChange: (value) => carName = value,
        label: 'Name'
    });

    // Поле цвета
    const colorInput = new Input({
        type: 'color',
        value: carColor,
        onChange: (value) => carColor = value,
        label: 'Color'
    });

    // Кнопка создания
    const createButton = new Button({
        text: 'Create Car',
        type: 'primary',
        onClick: () => {
            if (carName.trim()) {
                this.garageService.createCar(carName, carColor);
                // Сброс формы
                carName = '';
                carColor = '#ff0000';
                nameInput.update({ value: '' });
                colorInput.update({ value: '#ff0000' });
            } else {
                this.uiService.showNotification('Enter car name', 'error');
            }
        }
    });

    // Кнопка обновления выбранной машины
    const updateButton = new Button({
        text: 'Update Car',
        type: 'secondary',
        onClick: () => {
            const selectedCar = this.stateManager.getState().garage.selectedCar;
            if (!selectedCar) {
                this.uiService.showNotification('Select a car first', 'error');
                return;
            }
            if (carName.trim()) {
                this.garageService.updateCar(selectedCar.id, {
                    name: carName,
                    color: carColor
                });
            }
        }
    });

    container.appendChild(nameInput.render());
    container.appendChild(colorInput.render());
    container.appendChild(createButton.render());
    container.appendChild(updateButton.render());

    return container;
    }

    private renderControls(): HTMLElement {
        const container = document.createElement('div');

        const buttonGenerateRace = new Button({
            onClick: () => this.garageService.generateRandomCars(),
            text: 'GENERATE',
        })

        const buttonStartRace = new Button({
            onClick: () => this.engineService.startRace(),
            text: 'START RACE',
        })

        const buttonReset = new Button({
            onClick: () => this.engineService.resetRace(),
            text: 'RESET RACE',
        })

        container.append(buttonGenerateRace.render(), buttonStartRace.render(), buttonReset.render())
        return container;
    }

    private getCarPosition(carId: number):number {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);
        return participant?.position || 0;
    }

    private isCarSelected(carId: number): boolean{
        return this.stateManager.getState().garage.selectedCar?.id === carId;
    }

    private isRacing(carId: number): boolean {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);
        return participant?.status === 'racing';
    }

    unmount(): void {
        this.unsubscribe(); // Отписываемся от стейта
        this.raceService.stopAllAnimations();

        this.root.remove();
    }


    render(): HTMLElement {
        return this.root;
    }

    private renderCarList(): HTMLElement {

        const cars = this.stateManager.getState().garage.cars;

        const container = document.createElement('div');

        cars.forEach(item => {

            const car = new CarComponent({
                car: item,
                onSelect: () => this.garageService.selectCar(item),
                onRemove: () => this.garageService.deleteCar(item.id),
                onStart: () => this.engineService.startSingleCar(item.id),
                onStop: () => this.engineService.stopSingleCar(item.id),
                position: this.getCarPosition(item.id),
                isSelected: this.isCarSelected(item.id),
                isRacing: this.isRacing(item.id),

            })
            container.appendChild(car.render())
        })

        return container;
    }

    private renderPagination(): HTMLElement {
        const container = document.createElement('div');

        container.className = 'pagination';

        const { page, totalPages } = this.stateManager.getState().garage.pagination;

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page: ${page} of ${totalPages}`;

        const prevButton = new Button({
            onClick: () => this.garageService.loadCars(page - 1),
            text: '◀ Prev',
            type: 'secondary',
            disabled: page <= 1,
        })

        const nextButton = new Button({
            text: 'Next ▶',
            type: 'secondary',
            disabled: page >= totalPages,
            onClick: () => this.garageService.loadCars(page + 1)
        })

        container.append(pageInfo, prevButton.render(), nextButton.render())

        return container;
    }

    // Обновление при изменении стейта
   private update(): void {

        try {
            const state = this.stateManager.getState();
            const carsChanged = this.prevCars !== state.garage.cars;
            const pageChanged = this.prevPageInfo.page !== state.garage.pagination.page ||
                this.prevPageInfo.totalPages !== state.garage.pagination.totalPages;
            const totalChanged = this.prevTotalCars !== state.garage.pagination.total;
            const participantChanged = this.prevRaceParticipants !== state.race.participants

            if (!carsChanged && !pageChanged && !totalChanged && !participantChanged) return;

            this.prevCars = state.garage.cars;
            this.prevPageInfo.page = state.garage.pagination.page;
            this.prevPageInfo.totalPages = state.garage.pagination.totalPages;
            this.prevTotalCars = state.garage.pagination.total;
            this.prevRaceParticipants = state.race.participants;

            this.root.innerHTML = '';

            this.root.append(
                this.renderHeader(),
                this.renderPagination(),
                this.renderCreateForm(),
                this.renderControls(),
                this.renderCarList(),
            )

        } catch (err) {
            console.error(`GarageView render fail: ${err}`);
            this.uiService.showNotification('Render Error', 'error')
        }
    }


    mount(container: HTMLElement): void {
        // Загружаем машины при первом монтировании
        if (this.stateManager.getState().garage.cars.length === 0) {
            this.garageService.loadCars();
        }


                // ПЕРЕСОЗДАЁМ ПОДПИСКУ!
            this.unsubscribe = this.stateManager.subscribe(() => {
                this.update();
            });

        this.update();
        container.appendChild(this.root);


                // Если есть активные гонки - обновляем позиции
            const participants = this.stateManager.getState().race.participants;

        if (participants.length > 0) {
            console.log('🚗 Есть активные участники, форсируем обновление');
            this.update();  // Еще раз после добавления в DOM
        }

    }

}