import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './state-manager.ts';

interface TestState {
  count: number;
  text: string;
  nested: {
    value: boolean;
  };
}

describe('StateManager', () => {
  let manager: StateManager<TestState>;

  beforeEach(() => {
    manager = new StateManager({
      count: 0,
      text: 'hello',
      nested: { value: false } as { value: boolean }
    });
  });

  it('should return initial state', () => {
    expect(manager.getState().count).toBe(0);
    expect(manager.getState().text).toBe('hello');
    expect(manager.getState().nested).toEqual({ value: false });
  });

 it('should update state with object', () => {
    manager.setState({ count: 1 });
    expect(manager.getState().count).toBe(1);
    expect(manager.getState().text).toBe('hello'); // unchanged
    expect(manager.getState().nested).toEqual({ value: false });
  });

  it('should update state with function', () => {
    manager.setState((prev) => ({count: prev.count + 1}))
    expect(manager.getState().count).toBe(1)
  });


  it('should notify subscribers on change', () => {
    let notifiedState: TestState | null = null;

    manager.subscribe((state) => {
        notifiedState = state;
    })

    manager.setState({count: 42});

    expect(notifiedState).not.toBeNull();
    expect(notifiedState!.count).toBe(42);

  });

  it('should allow unsubscribe', () => {
    let notificationCount = 0;

    const unsubscribe = manager.subscribe(() => {
      notificationCount++;
    });

    manager.setState({ count: 1 });
    expect(notificationCount).toBe(1);

    unsubscribe();
    manager.setState({ count: 2 });
    expect(notificationCount).toBe(1); // все еще 1!
  });

});