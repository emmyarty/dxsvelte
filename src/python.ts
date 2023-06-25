import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'

let pythonCmd: string|null = null
let pipCmd: string|null = null

function checkPythonVersion(command) {
  try {
    const stdout = execSync(`${command} -V 2>/dev/null`, {
      encoding: 'utf-8',
      shell: process.env.SHELL
    })
    const match = stdout.match(/\d+\.\d+\.\d+/)
    if (match === null) return false
    const version = match[0]
    const [major, minor, patch] = version.split('.').map(Number)

    if (major < 3) return false
    if (major > 3) return [version, command]
    if (minor < 10) return false
    if (minor > 10) return [version, command]
    if (patch < 7) return false

    return [version, command]
  } catch (error) {
    return false
  }
}

function initPythonCommands() {
    const commands = ['python', 'python3', 'python3.11', 'python3.10', 'python3.12']

    for (let command of commands) {
      const versionArr = checkPythonVersion(command)
  
      if (versionArr) {
        pythonCmd = versionArr[1]
        pipCmd = pythonCmd.replace('ython', 'ip')
        return undefined
      }
    }
  
    throw new Error('A supported version of Python is not installed.')
}

export function getPythonCommand() {
    if (!pythonCmd) {
        initPythonCommands()
    }
    return pythonCmd
}

export function getPipCommand() {
    if (!pipCmd) {
        initPythonCommands()
    }
    return pipCmd
}

let mainApp: string|null = null

function initMainAppName() {
  const rxFunctionString = /os\.environ\.setdefault\(\s*("DJANGO_SETTINGS_MODULE"|'DJANGO_SETTINGS_MODULE')\s*,\s*("(.+)\.settings"|'(.+)\.settings')\)/
  const settingsStr = readFileSync(join(process.cwd(), 'manage.py'), 'utf8')
  const settingsStrExtract = settingsStr.match(rxFunctionString) ?? []
  const settingsModuleExtract = settingsStrExtract?.length > 3 ? settingsStrExtract[2].replaceAll('"', '').replaceAll("'", '') : ''
  if (settingsModuleExtract === '') {
    throw new Error('Could not extract settings from manage.py. Exiting.')
  }
  const mainModuleExtract = settingsModuleExtract.split('.')
  const mainModuleStr = mainModuleExtract[0]
  mainApp = mainModuleStr
  return undefined
}

export function getMainAppName() {
  if (!mainApp) {
    initMainAppName()
  }
  return mainApp
}