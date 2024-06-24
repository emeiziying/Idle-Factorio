import appEn from './i18n/app/en.json'
import dataEn from './i18n/data/en.json'

type Messages = typeof dataEn & typeof appEn

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
