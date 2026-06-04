import type { UIState } from '../../types';

export class Notification {
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  showNotification(notification: UIState['notifications'][0]): void {
    const element = document.createElement('div');
    element.className = `notification notification--${notification.type}`;
    element.id = notification.id;

    const message = document.createElement('span');
    message.textContent = notification.message;
    element.appendChild(message);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      element.remove();
    });
    element.appendChild(closeBtn);

    this.container.appendChild(element);

    setTimeout(() => {
      if (element.parentElement) {
        element.remove();
      }
    }, notification.timeout);
  }

  removeNotification(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.remove();
    }
  }

  clearAll(): void {
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  render(): HTMLElement {
    return this.container;
  }
}