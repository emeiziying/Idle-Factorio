import * as D from './factorio-build.models'
import { getJsonData } from './helpers'

// Set up paths
const appDataPath =
  process.env['AppData'] || `${process.env['HOME']}/Library/Application Support`
const factorioPath = `${appDataPath}/Factorio`
const modsPath = `${factorioPath}/mods`
const scriptOutputPath = `${factorioPath}/script-output`
const dataRawPath = `${scriptOutputPath}/data-raw-dump.json`
const tempPath = './scripts/temp'
const tempIconsPath = `${tempPath}/icons`
const modPath = `./data`
const modDataPath = `${modPath}/data-sample.json`
const modHashPath = `${modPath}/hash.json`

// Read main data JSON
const dataRaw = getJsonData<D.DataRawDump>(dataRawPath)

const allowedKey: string[] = ['type', 'name']

const data = Object.keys(dataRaw)

data.sort((a, b) => a.localeCompare(b))

console.log(JSON.stringify(data, null, 2))

// const data = (Object.keys(dataRaw) as (keyof D.DataRawDump)[]).reduce(
//   (pre, prototypeType) => {
//     const prototypes = dataRaw[prototypeType]

//     pre[prototypeType] = Object.keys(prototypes).reduce(
//       (pre2, internalName) => {
//         const internal = prototypes[internalName]
//         pre2[internalName] = (
//           Object.keys(internal) as (keyof typeof internal)[]
//         )
//           .filter((e) => allowedKey.includes(e))
//           .reduce(
//             (pre, cur) => {
//               pre[cur] = internal[cur]
//               return pre
//             },
//             {} as Record<string, unknown>,
//           )

//         return pre2
//       },
//       {} as Record<string, unknown>,
//     )

//     return pre
//   },
//   {} as Record<string, unknown>,
// )

// fs.writeFileSync(modDataPath, JSON.stringify(data, null, 2))
