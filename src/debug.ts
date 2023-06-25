import { ChildProcess, spawn } from 'child_process';

let childProcess: ChildProcess | null = null;

export function startProcess(): void {
  if (childProcess) {
    childProcess.kill('SIGTERM');
  }

  childProcess = spawn('python3', ['manage.py', 'runserver', '0.0.0.0:8000'], {
    stdio: 'inherit',
    shell: process.env.SHELL
  });

  // Listen for the Vite restart event
  process.on('SIGUSR2', gracefulShutdown);
}

function gracefulShutdown(): void {
  if (childProcess) {
    childProcess.kill('SIGTERM');
    childProcess.on('exit', () => {
      process.kill(process.pid, 'SIGUSR2');
    });
  } else {
    process.kill(process.pid, 'SIGUSR2');
  }
}
