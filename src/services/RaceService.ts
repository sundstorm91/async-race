import type { EngineApi } from "../api";
import type { EventBus } from "../core";
import type { StateManager } from "../core/state-manager";
import {  type AppState, type EngineStatus, type RaceParticipant, type RaceStatus, type RaceWinner } from "../types"
import type { UIService } from "./UiService";
import type { WinnerService } from "./WinnersService";

/* interface RaceResult {
  carId: number;
  success: boolean;     // доехала или сломалась
  time?: number;        // время в секундах (если success)
  brokenAt?: number;    // прогресс 0-100% где сломалась (если !success)
} */

interface IRaceService {
  // Управление гонкой

  startRace():Promise<void>
  resetRace(): void
  /* startSingleCar(carId: number): Promise<RaceResult> */

  startSingleCar(carId: number): Promise<void>;
  stopSingleCar(carId: number): Promise<void>

  // Состояние гонки
  getRaceStatus(): RaceStatus
  getParticipants(): RaceParticipant[]
  getWinner(): RaceWinner | null

  // Анимация
  /* updateCarPosition(carId: number, progress: number): void */
  stopAllAnimations(): void

  // Утилиты
  calculateRaceTime(velocity: number, distance: number): number
}


export class RaceService {

    private animationsId: Map<number, {
        startTime: number;
        animationId: number;
    }> = new Map();

    constructor(
        private stateManager: StateManager<AppState>,
        private eventBus: EventBus,
        private engineApi: EngineApi,
        private winnersService: WinnerService,
        private uiService: UIService,

    ) {}

    private calculateAnimationDuration (distance: number, velocity: number): number {
        const normalizedDistance = distance / 1000; // 500000 → 500
        const normalizedVelocity = velocity / 10; // 50 → 5

        const timeInSeconds = normalizedDistance / normalizedVelocity; // 500 / 5 = 100 сек
        const scaledTime = timeInSeconds / 10; // 100 → 10 секунд
        return scaledTime * 1000;
    }

    async startSingleCar(carId: number) {
        const currentCar = this.stateManager.getState().garage.cars.find(car => car.id === carId);

        if (!currentCar) {
            console.error('Current Car is not Found');
            return;
        }

        const carData = await this.engineApi.startEngine(currentCar.id);
        const duration = this.calculateAnimationDuration(carData.distance, carData.velocity);
        console.log(`participants - ${this.stateManager.getState().race.participants.length}`);


        const newParticipant: RaceParticipant = {
            car: currentCar,
            animationId: undefined,
            carId: currentCar.id,
            status: 'racing',
            position: 0,
            engineData: {
                distance: carData.distance,
                velocity: carData.velocity,
            }
        }

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                participants: [...prevState.race.participants, newParticipant ]
            }
        }))

        console.log(newParticipant, '<= добавили в участники')


        const animationPromise = new Promise<{type: 'animation_complete'}>((resolve) => {

            const animationInfo = {
                startTime: Date.now(),
                animationId: 0,
                resolve,
            }

            const rafCallback = () => {

                const currentTime = Date.now();
                const elapsed = currentTime - animationInfo.startTime;
                const progress = elapsed / duration;

                this.stateManager.setState(prevState => ({
                    race: {
                        ...prevState.race,
                        participants: prevState.race.participants.map(p => p.carId === carId ? {
                            ...p, position: progress*100,
                        } : p)
                    }
                }))

                if (progress >= 1) {
                    animationInfo.resolve({type: 'animation_complete'});
                    this.animationsId.delete(carId)
                } else {

                   const nextAnimationId = requestAnimationFrame(rafCallback);

                   this.animationsId.set(carId, {
                    ...animationInfo, animationId: nextAnimationId,
                   })


                }

            }

            const firstAnimationId = requestAnimationFrame(rafCallback);

            this.animationsId.set(carId, {
                ...animationInfo,
                animationId: firstAnimationId
            })


        })


        const drivePromise = this.engineApi.drive(carId)
            .then(result => ({
                type: 'drive_result' as const,
                success: result.success,
            }))
            .catch(err => ({
                type: 'drive_error' as const,
                err
            }))


            const result = await Promise.race([animationPromise, drivePromise]);

           if (result.type === 'drive_result' && !result.success) {

                const animationInfo = this.animationsId.get(carId);

                if (!animationInfo) return;
                cancelAnimationFrame(animationInfo.animationId)
                this.animationsId.delete(carId)

                this.markCarAsBroken(carId)

                return { success: false }
           }

           if (result.type === 'drive_result' && result.success) {

                await animationPromise;
                this.animationsId.delete(carId);
                this.markCarAsFinished(carId)
                console.log('drive_result && result.success')
                return { success: true, time: duration / 1000 }
           }

           if (result.type === 'animation_complete') {
                console.log('a-complete!')
                const driveResult = await drivePromise;
                this.animationsId.delete(carId);
                if (driveResult.type === 'drive_result' && driveResult.success) {

                    this.markCarAsFinished(carId)

                    console.log('закончили успешно')
                    return { success: driveResult.success, time: duration / 1000  }
                } else {
                    this.markCarAsBroken(carId)
                    console.log('закончили НЕ успешно')
                    return { success: false }
                }
           }

    }

    stopSingleCar(carId: number) {
        const animationInfo = this.animationsId.get(carId);
        if (!animationInfo) return;

        cancelAnimationFrame(animationInfo.animationId)
        this.animationsId.delete(carId)
        this.markCarAsStopped(carId);
    }

    async startRace(): Promise<RaceWinner | null> {
        this.resetRace();

        /* установка в режим гонки */

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race, status: 'racing'
            }
        }))

        const cars = this.stateManager.getState().garage.cars;

        const promises = cars.map(car =>

            this.startSingleCar(car.id).then(r => {
                console.log('Результат для машины', car.id, ':', r);

                if (!r) {
                    console.error('Результат undefined для машины', car.id);
                    return { success: false, carId: car.id };
                }

                return {
                    success: r.success,
                    time: r.time,
                    carId: car.id,
                };
            })
        );

        const results = await Promise.all(promises);

        const sucessfullyResults = results.filter(r => r?.success && r.time !== undefined);
        console.log(sucessfullyResults)

        if (sucessfullyResults.length === 0) return null;

        const winnerResult = sucessfullyResults.reduce((fast, current) => current.time! < fast.time! ? current : fast);

        const winnerCar = this.stateManager.getState().garage.cars.find(car => car.id === winnerResult.carId);

        if (!winnerCar) {
            console.error(`Winner car ${winnerCar} not found in garage`)
            return null;
        }

        const raceWinner:  RaceWinner = {
            car: winnerCar,
            time: winnerResult.time!
        }
        console.log('сформирован победитель (race-service)')

        this.stateManager.setState(prevState => ({
            race: {
                ...prevState.race,
                status: 'finished',
                winner: raceWinner,
            }
        }))

        this.winnersService.addWinner(raceWinner);

        /* this.uiService.showWinnerModal(raceWinner); */

        cars.forEach(car => this.engineApi.stopEngine(car.id));

        return raceWinner;

    };

    getParticipants(): RaceParticipant[] {
        return this.stateManager.getState().race.participants;
    }

    getRaceStatus(): RaceStatus {
        return this.stateManager.getState().race.status;
    }

    getWinner(): RaceWinner | null {
        return this.stateManager.getState().race.winner;
    }


    resetRace(): void {

        this.stopAllAnimations();
        const promises = this.stateManager.getState().race.participants.map(p => this.engineApi.stopEngine(p.carId).catch(()=>{}));
        Promise.all(promises).catch(()=>{})
        this.stateManager.setState ({
            race: {
                results: [],
                winner: null,
                participants: [],
                status: 'idle',

            }
        })
        /* this.finishedCars.clear();  => проверить! */
        this.eventBus.emit('race:reset')
    }

    calculateRaceTime(velocity: number, distance: number): number {
        return Math.round(distance / velocity)
    }

    private markCarAsFinished(carId: number) {
        this.engineApi.stopEngine(carId).catch(() => {});
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p =>
                    p.carId === carId ? { ...p, status: 'finished' } : p
                )
            }
            }));
    }

    private markCarAsBroken(carId: number) {
        this.engineApi.stopEngine(carId).catch(() => {});
        this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                        p.carId === carId ? { ...p, status: 'broken' } : p
                        )
                    }
                }));
    }

    private markCarAsStopped(carId: number) {
        this.engineApi.stopEngine(carId).catch(() => {});
        this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                        p.carId === carId ? { ...p, status: 'stopped' } : p
                        )
                    }
                }));
    }

    private stopAllAnimations() {
        this.animationsId.forEach(a => cancelAnimationFrame(a.animationId))
        this.animationsId.clear();
    }

}

