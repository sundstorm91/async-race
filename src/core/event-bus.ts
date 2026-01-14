type EventCallback = (data?: any) => void;

export class EventBus {

    private events: Map<string, EventCallback[]> = new Map();
    /**
    * Подписаться на событие
    * @param event - название события (например, 'car:added')
    * @param callback - функция-обработчик
    */

    on(event: string, callback: EventCallback):void {

         // Если события еще нет - создаем пустой массив колбэков

        if (!this.events.has(event)) {
            this.events.set(event, [])
        }

        // Добавляем колбэк в массив

        this.events.get(event)!.push(callback)
    }

        /**
   * Отправить событие
   * @param event - название события
   * @param data - данные для передачи (опционально)
        */
    emit(event: string, data?: any):void {

        const callbacks = this.events.get(event);

        if (callbacks) {

            callbacks.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in Event handler for ${event}`, error)
                }
            })
        }


    }

    /**
   * Отписаться от события
   * @param event - название события
   * @param callbackToRemove - колбэк для удаления
   */

    off(event: string, callbackToRemove: EventCallback) {

        const callback = this.events.get(event);

        if (callback) {
            const filtredCallbacks = callback.filter(callback => callback !== callbackToRemove)
            // Обновляем массив колбэков
            this.events.set(event, filtredCallbacks)
        }

    }

    /**
   * Подписаться на событие один раз
   * @param event - название события
   * @param callback - функция-обработчик (вызовется только один раз)
   */

    once(event: string, callback: EventCallback) {


        const onceCallback = (data: any) => {
            callback(data);
            this.off(event, onceCallback)
        }

        this.on(event, onceCallback)
    }

    /* Очистить подписки на событие опционально, выборочно или все */

    clear(event?: string) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    hasListeners(event: string) {
        const callbacks = this.events.get(event);
        return !!callbacks && callbacks.length > 0; /* Проверка callbacks на булевое значение, и при этом длина массива должна быть больше 0. Т.е что-то должно быть! */
    }

    listenerCount(event: string) {
        const callbacks = this.events.get(event);
        return callbacks ? callbacks.length : 0
    }

}