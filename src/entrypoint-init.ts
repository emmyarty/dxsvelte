import {
  __basedir,
} from "./settings/config";

import { updateAll } from "./django/addFiles";

// Prepare root files
updateAll();

console.log('DxSvelte initialisation completed. Remember to run npm i in order to install local dependencies and\nupdate your .gitignore to exclude node_modules')