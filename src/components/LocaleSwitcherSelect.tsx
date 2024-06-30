import clsx from 'clsx';
import { ChangeEvent, ReactNode, useTransition } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  defaultValue: string;
  label: string;
}

export default function LocaleSwitcherSelect({
  children,
  defaultValue,
  label,
}: Props) {
  const [isPending] = useTransition();
  const { i18n } = useTranslation();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value;
    void i18n.changeLanguage(nextLocale);
  }

  return (
    <label
      className={clsx(
        'relative text-gray-400 ',
        isPending && 'transition-opacity [&:disabled]:opacity-30'
      )}
    >
      <p className="sr-only">{label}</p>
      <select
        className="inline-flex appearance-none focus:outline-none bg-transparent py-3 pl-2 pr-6"
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={onSelectChange}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2 top-[8px]">⌄</span>
    </label>
  );
}
