import type { EngineApi, GarageApi } from "../api";
import type { EventBus } from "../core";
import type { StateManager } from "../core/state-manager";
import { ApiError, type AppState, type RaceParticipant, type RaceStatus, type RaceWinner } from "../types"

interface RaceResult {
  carId: number;
  success: boolean;     // доехала или сломалась
  time?: number;        // время в секундах (если success)
  brokenAt?: number;    // прогресс 0-100% где сломалась (если !success)
}

interface IRaceService {
  // Управление гонкой
  startRace(): Promise<RaceWinner | null>
  resetRace(): void
  startSingleCar(carId: number): Promise<RaceResult>
  stopSingleCar(carId: number): Promise<void>

  // Состояние гонки
  getRaceStatus(): RaceStatus
  getParticipants(): RaceParticipant[]
  getWinner(): RaceWinner | null

  // Анимация
  updateCarPosition(carId: number, progress: number): void
  stopAllAnimations(): void

  // Утилиты
  calculateRaceTime(velocity: number, distance: number): number
}

export class RaceService implements IRaceService {
    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private engineApi: EngineApi,
    ) {}

    private stopAnimationForCar(carId: number):void {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);

        if (participant?.animationId) {
            cancelAnimationFrame(participant.animationId)
        }
    }

    async startSingleCar(carId: number): Promise<RaceResult> {
        let engineStarted: boolean = false;

        try {

            const { distance , velocity } = await this.engineApi.startEngine(carId);
            engineStarted = true;
            const driveResult = await this.engineApi.drive(carId);


            return {

                carId,
                success: driveResult.success,
                time: driveResult.success ? distance / velocity : undefined

            }


        } catch (err) {

            if (engineStarted) {
                await this.engineApi.stopEngine(carId).catch(() => {});
            }

            if (err instanceof ApiError && err.status === 500) {

                return {
                    carId,
                    success: false,
                }
            }

            throw err;
        }
    }

    async stopSingleCar(carId: number): Promise<void> {

        await this.engineApi.stopEngine(carId)
        this.stopAnimationForCar(carId)

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? { ...p, status: 'stopped', animationId: undefined} : p)
            }
        }))
    }

    async startRace(): Promise<RaceWinner | null> {
        // 1. Сброс
        this.resetRace();

        // 2. Создаём участников из текущих машин
        const cars = this.stateManager.getState().garage.cars;
        const participants: RaceParticipant[] = cars.map(car => ({
            carId: car.id,
            car,
            status: 'starting' as const,
            startTime: Date.now()
        }));

        // 3. Начинаем гонку
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                status: 'racing',
                participants
            }
        }));

        this.eventBus.emit('race:started', { participants });

        // 4. Запускаем всех
        const promises = participants.map(p => this.startSingleCar(p.carId));
        const results = await Promise.all(promises);

        // 5. Обновляем статусы участников по результатам
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p => {
                    const result = results.find(r => r.carId === p.carId);
                    return {
                        ...p,
                        status: result?.success ? 'finished' : 'broken',
                        finishTime: result?.success ? Date.now() : undefined
                    };
                })
            }
        }));

        // 6. Находим победителя
        const winnerResult = results.find(r => r.success);
        if (!winnerResult) {
            this.stateManager.setState(prev => ({
                race: { ...prev.race, status: 'finished' }
            }));
            return null;
        }

        const winnerCar = cars.find(c => c.id === winnerResult.carId)!;
        const winner: RaceWinner = { car: winnerCar, time: winnerResult.time! };

        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                status: 'finished',
                winner
            }
        }));

        this.eventBus.emit('race:finished', { winner });
        return winner;
    }

    getParticipants(): RaceParticipant[] {
        return this.stateManager.getState().race.participants;
    }

    getRaceStatus(): RaceStatus {
        return this.stateManager.getState().race.status;
    }

    getWinner(): RaceWinner | null {
        return this.stateManager.getState().race.winner;
    }

    stopAllAnimations():void {
        this.stateManager.getState().race.participants.forEach(item => {

            if (item.animationId) {
                cancelAnimationFrame(item.animationId) /* requestAnimationFrame */
            }

        })

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => ({
                    ...p,
                    animationId: undefined,
                }))
            }
        }))
    }

    resetRace(): void {

        this.stopAllAnimations();

        const promises = this.stateManager.getState().race.participants.map(participant => this.engineApi.stopEngine(participant.carId).catch(()=>{}));

        Promise.all(promises).catch(()=>{})

        this.stateManager.setState(prevState => ({
            race: {
                results: [],
                winner: null,
                participants: [],
                status: 'idle'
            }
        }))

        this.eventBus.emit('race:reset')
    }

    calculateRaceTime(velocity: number, distance: number): number {
        return Math.round(distance / velocity)
    }



     updateCarPosition(carId: number, progress: number): void {
        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? {...p, position: progress} : p)
            }
        }))
    }

}