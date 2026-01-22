import type { ModalProps } from '../../types';

export class Modal {
  private overlay: HTMLDivElement;
  private modal: HTMLDivElement;
  private header: HTMLDivElement;
  private body: HTMLDivElement;
  private closeButton: HTMLButtonElement;

  constructor(props: ModalProps) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.display = 'none';

    this.modal = document.createElement('div');
    this.modal.className = `modal ${props.size ? `modal--${props.size}` : ''}`;

    this.header = document.createElement('div');
    this.header.className = 'modal-header';

    const title = document.createElement('h2');
    title.textContent = props.title;
    this.header.appendChild(title);

    this.closeButton = document.createElement('button');
    this.closeButton.className = 'modal-close';
    this.closeButton.textContent = '×';
    this.closeButton.addEventListener('click', () => props.onClose());
    this.header.appendChild(this.closeButton);

    this.body = document.createElement('div');
    this.body.className = 'modal-body';

    const children = Array.isArray(props.children)
      ? props.children
      : [props.children];

    children.forEach(child => {
      if (child instanceof HTMLElement) {
        this.body.appendChild(child);
      }
    });

    this.modal.appendChild(this.header);
    this.modal.appendChild(this.body);
    this.overlay.appendChild(this.modal);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        props.onClose();
      }
    });

    if (props.isOpen) {
      this.open();
    }
  }

  open(): void {
    this.overlay.style.display = 'flex';
    document.body.appendChild(this.overlay);
  }

  close(): void {
    this.overlay.style.display = 'none';
    if (this.overlay.parentElement) {
      this.overlay.parentElement.removeChild(this.overlay);
    }
  }

  render(): HTMLElement {
    return this.overlay;
  }

  update(props: Partial<ModalProps>): void {
    if (props.isOpen !== undefined) {
      props.isOpen ? this.open() : this.close();
    }
  }
}