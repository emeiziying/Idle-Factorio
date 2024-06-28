import Layout from '@/Layout';
import ErrorPage from '@/error-page';
import Game from '@/pages/game';
import Providers from '@/providers';
// import glpkWasm from 'glpk-wasm/dist/glpk.all.wasm?url';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import './i18n';
import './index.css';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { loadModule } from 'glpk-ts';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Game />,
      },
    ],
  },
]);

loadModule('/glpk.all.wasm');
// glpkWasm().then((mod) => {
//   const ver = mod._glp_version();
//   const verStr = mod.UTF8ToString(ver);
//   console.log('GLPK version:', verStr);
// });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
);
