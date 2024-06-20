// import the original type declarations
import 'i18next';
// import all namespaces (for the default language, only)
import app from '@@/public/i18n/zh/app.json';
import data from '@@/public/i18n/zh/data.json';

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: 'app';
    // custom resources type
    // resources: typeof app & typeof data;
    resources: {
      app: typeof app;
      data: typeof data;
    };
  }
}
