// This is a file which gets generated per module and in the same directory.
// It ensures that objects being imported are 'localised' as appropriate.

//@ts-ignore
import core from `{{fnameRouter}}`
const route = `{{path}}`

export const ServerSideProps = core.serverDataStore[route].data

export default { ServerSideProps }