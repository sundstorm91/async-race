/* private simpleCarAnimation(carId: number): void {
        console.log('🎬 Анимация запущена для машины', carId);

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5; // 5% за шаг

            console.log(`📈 Машина ${carId}: ${progress}%`);

            // ОБНОВЛЯЕМ ПОЗИЦИЮ
            this.updateCarPosition(carId, progress);

            if (progress >= 100) {
                clearInterval(interval);
                console.log(`🏁 Машина ${carId} финишировала!`);

                // Обновляем статус
                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                            p.carId === carId
                                ? { ...p, status: 'finished', position: 100 }
                                : p
                        )
                    }
                }));
            }
        }, 100); // Каждые 100мс
    } */

/* updateCarPosition(carId: number, progress: number): void {
        this.stateManager.setState(prevState => ({
        race: {
                ...prevState.race,
                participants: prevState.race.participants.map(p => p.carId === carId ? {...p, position: progress} : p)
            }
        }))
    } */


 /* private startCarAnimation(carId: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            console.log('🎬 ANIMATION START for car', carId, 'duration:', duration, 'ms');

            const startTime = Date.now();
            let animationId: number;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min((elapsed / duration) * 100, 100);

                // Обновляем позицию
                this.updateCarPosition(carId, progress);
                console.log('📈 Car', carId, 'position:', progress.toFixed(1) + '%');

                if (progress < 100) {
                    animationId = requestAnimationFrame(animate);

                    // Сохраняем animationId
                    this.stateManager.setState(prev => ({
                        race: {
                            ...prev.race,
                            participants: prev.race.participants.map(p =>
                                p.carId === carId
                                    ? { ...p, animationId }
                                    : p
                            )
                        }
                    }));
                } else {
                    console.log('🏁 Car', carId, 'animation finished');
                    resolve(); // Анимация завершена!
                }
            };

            animationId = requestAnimationFrame(animate);
        });
    } */


 /* async startRace(): Promise<RaceWinner | null> {
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
    } */


         /*     async startSingleCar(carId: number): Promise<RaceResult> {
        console.log('🏁 START_SINGLE_CAR called for:', carId);

        try {
            // ПРОВЕРЯЕМ: есть ли уже участник?
            let participant = this.stateManager.getState().race.participants
                .find(p => p.carId === carId);

            // Если нет (одиночный старт) - создаём
            if (!participant) {
                const car = this.stateManager.getState().garage.cars.find(c => c.id === carId);
                if (!car) throw new Error(`Car ${carId} not found`);

                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: [
                            ...prev.race.participants,
                            {
                                carId,
                                car,
                                status: 'starting' as const,
                                startTime: Date.now(),
                                animationId: undefined,
                                position: 0
                            }
                        ]
                    }
                }));
            } else {
                // Если уже есть - обновляем статус
                this.stateManager.setState(prev => ({
                    race: {
                        ...prev.race,
                        participants: prev.race.participants.map(p =>
                            p.carId === carId
                                ? { ...p, status: 'starting' as const }
                                : p
                        )
                    }
                }));
            }

            console.log('1. Starting engine...');
            const { distance, velocity } = await this.engineApi.startEngine(carId);
            console.log('2. Engine started:', { distance, velocity });

            // Обновляем статус на racing
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? { ...p, status: 'racing' as const }
                            : p
                    )
                }
            }));

            // Рассчитываем время анимации
            const duration = (distance / velocity) * 1000; // мс
            console.log('⏱️ Animation duration:', duration, 'ms');

            // ЗАПУСКАЕМ АНИМАЦИЮ
            this.startCarAnimation(carId, duration);

            // ЖДЁМ окончания анимации перед drive
            // Drive должен совпадать с окончанием анимации
            const driveResult = await new Promise<{success: boolean}>((resolve) => {
                setTimeout(async () => {
                    try {
                        console.log('3. Starting drive...');
                        const result = await this.engineApi.drive(carId);
                        console.log('4. Drive result:', result);
                        resolve(result);
                    } catch (error) {
                        console.error('Drive error:', error);
                        resolve({ success: false });
                    }
                }, duration); // Ждём duration мс
            });

            // Обновляем статус по результату
            this.stateManager.setState(prev => ({
                race: {
                    ...prev.race,
                    participants: prev.race.participants.map(p =>
                        p.carId === carId
                            ? {
                                ...p,
                                status: driveResult.success ? 'finished' as const : 'broken' as const,
                                finishTime: Date.now(),
                                position: driveResult.success ? 100 : 50 // если сломалась - останавливаем на 50%
                            }
                            : p
                    )
                }
            }));

            return {
                carId,
                success: driveResult.success,
                time: driveResult.success ? distance / velocity : undefined
            };

        } catch (err) {
            console.error('💥 Error in startSingleCar:', err);
        // Если ошибка — помечаем как broken
        this.stateManager.setState(prev => ({
            race: {
                ...prev.race,
                participants: prev.race.participants.map(p =>
                    p.carId === carId
                        ? { ...p, status: 'broken' as const }
                        : p
                )
            }
        }));

        if (err instanceof ApiError && err.status === 500) {
            return { carId, success: false };
        }
        throw err;
        }
    } */