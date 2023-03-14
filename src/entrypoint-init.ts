import {
  __basedir,
} from "./settings/config";

import { installRootFiles } from "./django/addFiles";

// Prepare root files
installRootFiles();

console.log('DxSvelte initialisation completed.\nDon\t forget to run `npm i` in order to install local dependencies and update\nyour .gitignore to exclude `node_modules`')