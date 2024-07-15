import Navigation from '@/components/Navigation';
import dataJSON from '@/data/1.1/data.json';
import hashJSON from '@/data/1.1/hash.json';
import { Language, ModData, ModHash, ModI18n } from '@/models';
import { useAppDispatch } from '@/store/hooks';
import { loadMod } from '@/store/modules/datasetsSlice';
import { SET_LANGUAGE } from '@/store/modules/preferencesSlice';
import { SET_RESEARCHED_TECHNOLOGIES } from '@/store/modules/settingsSlice';
import Container from '@mui/material/Container';
import { useWhyDidYouUpdate } from 'ahooks';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const loadI18n = (lng: string) => {
      const i18nJSON = i18n.getResourceBundle(lng, 'data') as ModI18n;
      dispatch(loadMod({ i18n: { id: `1.1-${lng}`, value: i18nJSON } }));
      dispatch(SET_LANGUAGE(lng as Language));
    };

    dispatch(
      loadMod({
        data: { id: '1.1', value: dataJSON as unknown as ModData },
        hash: { id: '1.1', value: hashJSON as ModHash },
      })
    );
    dispatch(SET_RESEARCHED_TECHNOLOGIES([]));

    loadI18n(i18n.language);
    i18n.on('languageChanged', (lng) => {
      loadI18n(lng);
    });

    return () => {
      i18n.off('languageChanged');
    };
  }, [dispatch, i18n]);

  useWhyDidYouUpdate('Layout', { i18n, dispatch });

  return (
    <div>
      <Navigation />
      <Container maxWidth="xl">
        <Outlet />
      </Container>
    </div>
  );
};

export default Layout;
