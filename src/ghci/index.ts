import { spawn } from 'child_process';

export const getProcess = (bin: string, procHandler: (str: string) => void) => {
  const proc = spawn(bin, ['ghci']);

  proc.stdout.setEncoding('utf-8');
  proc.stderr.setEncoding('utf-8');
  proc.stdout.on('data', procHandler);
  proc.stderr.on('data', procHandler);

  return proc;
};
