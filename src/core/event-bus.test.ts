import { describe, it, expect } from 'vitest';
import { EventBus } from './event-bus.js';

describe('EventBus', () => {

  it('should subscribe and emit events', () => {
    const bus = new EventBus();
    let received = '';

    bus.on('test', (data) => {
      received = data;
    });

    bus.emit('test', 'hello');

    expect(received).toBe('hello');
  });

  it('should handle multiple subscribers', () => {
    const bus = new EventBus();
    const calls: string[] = [];

    bus.on('multi', () => calls.push('first'));
    bus.on('multi', () => calls.push('second'));

    bus.emit('multi');

    expect(calls).toEqual(['first', 'second']);
  });
});