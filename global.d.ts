import app from './i18n/app/zh.json'
import common from './i18n/common/common.json'
import data from './i18n/data/zh.json'

type Messages = typeof data & typeof app & typeof common

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
