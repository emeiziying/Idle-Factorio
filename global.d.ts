import zh from './data/i18n/zh.json'
import en from './i18n/en.json'

type Messages = typeof en & typeof zh

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
