import fs from 'fs'
import { join } from 'path'
import { posixSlash } from './utils'
import { __basedir } from '../settings/config'

export function triggerRestart() {
  const filePath = posixSlash(join(__basedir, 'manage.py'))
  fs.writeFileSync(filePath, fs.readFileSync(filePath))
}
