import { useAppSelector } from '@/store/hooks';
import { recordsState } from '@/store/modules/recordsSlice';
import { useWhyDidYouUpdate } from 'ahooks';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

function App() {
  const [count, setCount] = useState(0);
  const { t } = useTranslation('app');

  const records = useAppSelector(recordsState);

  useWhyDidYouUpdate('App', { records });

  return (
    <>
      <h1>{t('app.error')}</h1>

      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
