export class StateManager<T> {
    private state: T;
    private listeners: Array<(state: T) => void> = [];
    /* private fieldListeners: Map<keyof T, Array<(value: any) => void>> = new Map(); */

    constructor(initialState: T) {
        this.state = initialState
    }

    public getState(): T {
        return this.state;
    }

    public setState(updater: Partial<T> | ((prevState: T) => Partial<T>)): void {
        const oldState = this.state;

        let newPartialState: Partial<T>;

        if (updater instanceof Function) {
            newPartialState = updater(oldState);

        } else {

            newPartialState = updater;
        }

        const newState = {...oldState, ...newPartialState};

        if (JSON.stringify(oldState) === JSON.stringify(newState)) {
            return;
        }

        this.state = newState;

        this.listeners.forEach(listener => {
            try {
                listener(this.state)
            } catch(error) {
                console.error('Error in state listener:', error)
            }
        })
    }

    subscribe(callback: (state: T) => void ): () => void {
        this.listeners.push(callback);

        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback)
        }
    }

    public clearListeners(): void {
        this.listeners = []
    }
}