import { useTranslation } from 'react-i18next';
import LocaleSwitcherSelect from './LocaleSwitcherSelect';
import { locales } from '@/i18n';

export default function LocaleSwitcher() {
  const { t, i18n } = useTranslation();
  return (
    <LocaleSwitcherSelect defaultValue={i18n.language} label="">
      {locales.map((cur) => (
        <option key={cur} value={cur}>
          {t('locale', { locale: cur })}
        </option>
      ))}
    </LocaleSwitcherSelect>
  );
}
