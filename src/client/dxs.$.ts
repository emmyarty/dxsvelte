// This is a file which gets generated per module and in the same directory.
// It ensures that objects being imported are 'localised' as appropriate.

//@ts-ignore
import core from `{{fnameRouter}}`
const route = `{{path}}`

export const data = {}

function mutateObject(source: any, target: any) {
    Object.keys(target).forEach(key => delete target[key])
    Object.assign(target, source);
}

core.serverDataStore[route].data.subscribe((update: any) => mutateObject(update, data))