import { exec as execCallback }  from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCallback);

const checkVersion = async (command: string) => {
    try {
        const { stdout } = await exec(`${command} -V`);
        const match = stdout.match(/\d+\.\d+\.\d+/)
        if (match === null) return false
        const version = match[0];
        const [major, minor, patch] = version.split('.').map(Number);

        if (major < 3) return false;
        if (major > 3) return [version, command];
        if (minor < 10) return false;
        if (minor > 10) return [version, command];
        if (patch < 7) return false;

        return [version, command];
    } catch (error) {
        return false;
    }
};

export const getPythonVersion = async () => {
    const commands = ['python', 'python3', 'python3.11', 'python3.10', 'python3.12'];

    for (let command of commands) {
        const versionArr = await checkVersion(command);

        if (versionArr) {
            // console.log("Supported version of Python detected:", versionArr[0]);
            return versionArr[1];
        }
    }

    throw new Error("A supported version of Python is not installed.");
};