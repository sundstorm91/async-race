import { carSVG } from "../assets/svg/CarSVG";
import { Button } from "../components/Button/Button";
import type { StateManager } from "../core/state-manager";
import type { UIService } from "../services/UiService";
import type { WinnerService } from "../services/WinnersService";
import type { AppState } from "../types";

interface IWinnersView {
    mount(container: HTMLElement): void;
    unmount(): void;
    render(): HTMLElement;
}

export class WinnersView implements IWinnersView {
    private root: HTMLDivElement;
    private unsubscribe: () => void;

    constructor(
        private uiService: UIService,
        private stateManager: StateManager<AppState>,
        private winnersService: WinnerService,
    ) {
        this.root = document.createElement('div');
        this.root.className = 'winners-view';

        this.unsubscribe = this.stateManager.subscribe(() => {
            console.log('🔄 WinnersView: стейт изменился!');
            this.update();
        });
    }

    private renderHeader(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'winners-header';

        const title = document.createElement('h1');
        title.textContent = '🏆 Winners';

        const garageButton = new Button({
            onClick: () => this.uiService.switchView('garage'),
            text: '🚗 Garage',
            type: 'primary',
        });

        // Показываем только топ-5
        const totalWinners = this.stateManager.getState().winners.winners.length;
        const counter = document.createElement('span');
        counter.className = 'winners-counter';
        counter.textContent = `Total winners: ${totalWinners}`;

        container.appendChild(title);
        container.appendChild(counter);
        container.appendChild(garageButton.render());

        return container;
    }

    private renderTable(): HTMLElement {
        const table = document.createElement('table');
        table.className = 'winners-table';

        // Простой заголовок без сортировки
        const headers = ['#', 'Car', 'Name', 'Wins', 'Best Time'];
        const headerRow = document.createElement('tr');

        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        table.appendChild(headerRow);

        // Берем только топ-5 (первые 5 из массива)
        const allWinners = this.stateManager.getState().winners.winners;

        const topWinners = allWinners.slice(0, 5);

        // Строки таблицы
        topWinners.forEach((winner, index) => {
            const row = document.createElement('tr');

            // Номер
            const numCell = document.createElement('td');
            numCell.textContent = (index + 1).toString();

            // Машина + цвет
            const carCell = document.createElement('td');
            const carImage = document.createElement('div');

            carImage.innerHTML = carSVG({color: winner.car.color, width: 60, height: 40 })
            carCell.appendChild(carImage);

            // Имя
            const nameCell = document.createElement('td');
            nameCell.textContent = winner.car.name;

            // Победы
            const winsCell = document.createElement('td');
            winsCell.textContent = winner.wins.toString();

            // Время
            const timeCell = document.createElement('td');
            timeCell.textContent = `${winner.time.toFixed(2)}s`;

            row.appendChild(numCell);
            row.appendChild(carCell);
            row.appendChild(nameCell);
            row.appendChild(winsCell);
            row.appendChild(timeCell);
            table.appendChild(row);
        });

        return table;
    }

    private update(): void {

        console.log('🎨 update() вызван');
        const winnersA = this.stateManager.getState().winners.winners;
        console.log('winners в update:', JSON.stringify(winnersA, null, 2)); // полный лог



        this.root.innerHTML = '';
        this.root.appendChild(this.renderHeader());

        const winners = this.stateManager.getState().winners.winners;

        if (winners.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'No winners yet. Start a race!';
            this.root.appendChild(message);
        } else {
            this.root.appendChild(this.renderTable());
        }
}

    async mount(container: HTMLElement): Promise<void> {
        // Всегда загружаем при переходе
        await this.winnersService.loadWinners();
        this.update();
        container.appendChild(this.root);
    }

    unmount(): void {
        this.unsubscribe();
        this.root.remove();
    }

    render(): HTMLElement {
        return this.root;
    }
}