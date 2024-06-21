declare type Nullable<T = void> = T | null | undefined;

declare interface SelectItem<T = string> {
  label?: string;
  value: T;
  styleClass?: string;
  icon?: string;
  title?: string;
  disabled?: boolean;
}

declare interface MenuItem {
  id: string;
  label: string;
  command: () => void;
}
