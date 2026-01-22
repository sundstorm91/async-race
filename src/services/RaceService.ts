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
        private garageApi: GarageApi,
    ) {}

    async startSingleCar(carId: number): Promise<RaceResult> {
        try {
            const { distance , velocity } = await this.engineApi.startEngine(carId);
            const driveResult = await this.engineApi.drive(carId);

            return {

                carId,
                success: driveResult.success,
                time: driveResult.success ? distance / velocity : undefined

            }


        } catch (err) {

            if (err instanceof ApiError && err.status === 500) {

                return {
                    carId,
                    success: false,
                }
            }

            throw err;
        }
    }


    async startRace(): Promise<RaceWinner | null> {
    // 1. Берем участников
    const cars = this.stateManager.getState().garage.cars;

    // 2. Запускаем всех параллельно
    const promises = cars.map(car => this.startSingleCar(car.id));
    const results = await Promise.all(promises);

    // 3. Находим победителя (первый успешный)
    const winnerResult = results.find(r => r.success);

    if (!winnerResult) return null; // все сломались

    // 4. Возвращаем победителя
    const winnerCar = cars.find(c => c.id === winnerResult.carId)!;
    return {
        car: winnerCar,
        time: winnerResult.time!
    };

    }

    getParticipants(): RaceParticipant[] {
        const cars = this.stateManager.getState().garage.cars;

        const existingParticipant = this.stateManager.getState().race.participants;

        return cars.map(car => {

            const isExisting = existingParticipant.find(item => item.carId === car.id);

            return {
                car,
                carId: car.id,
                status: isExisting ? isExisting.status : 'idle',
                startTime: isExisting?.startTime,
                animationId: isExisting?.animationId,
                finishTime: isExisting?.finishTime,
            }
        })
    }

    getRaceStatus(): RaceStatus {
        return this.stateManager.getState().race.status;
    }

    getWinner(): RaceWinner | null {
        return this.stateManager.getState().race.winner;
    }

    private stopAnimationForCar(carId: number):void {
        const participant = this.stateManager.getState().race.participants.find(p => p.carId === carId);

        if (participant?.animationId) {
            cancelAnimationFrame(participant.animationId)
        }
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

        this.stateManager.getState().race.participants.forEach(item => {

            if (item.animationId) {
                cancelAnimationFrame(item.animationId) /* requestAnimationFrame */
            }

        })

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

    async stopSingleCar(carId: number): Promise<void> {
        const singleCar = await this.garageApi.getCar(carId);
        await this.engineApi.stopEngine(singleCar.id)
        this.stopAnimationForCar(carId)

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? { ...p, status: 'stopped', animationId: undefined} : p)
            }
        }))
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