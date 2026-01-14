import type { Car } from "./domain.types";

export interface ButtonProps {
  text: string;
  type?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick: () => void;
  icon?: string; // опциональная иконка
}


export interface InputProps {
  type?: 'text' | 'number' | 'color' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export interface CarProps {
  car: Car;
  isSelected: boolean;
  isRacing?: boolean;
  position?: number; // прогресс анимации 0-100
  onSelect: () => void;
  onRemove: () => void;
  onStart: () => void;
  onStop: () => void;
}

export interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: HTMLElement | HTMLElement[];
  size?: 'small' | 'medium' | 'large';
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visiblePages?: number; // сколько страниц показывать
}