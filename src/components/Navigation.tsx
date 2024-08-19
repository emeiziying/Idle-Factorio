import AutoSave from '@/components/AutoSave';
import LocaleSwitcher from './LocaleSwitcher';

export default function Navigation() {
  return (
    <div className="flex justify-center w-full">
      <nav className="container flex justify-between p-2">
        <div />
        <div className="flex items-center">
          <AutoSave />
          <LocaleSwitcher />
        </div>
      </nav>
    </div>
  );
}
