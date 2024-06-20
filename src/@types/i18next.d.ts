// import the original type declarations
import 'i18next';
// import all namespaces (for the default language, only)
import app from '@@/public/i18n/app/zh.json';
import data from '@@/public/i18n/data/zh.json';

declare module 'i18next' {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    // defaultNS: 'app';
    // custom resources type
    resources: typeof app & typeof data;
  }
}
