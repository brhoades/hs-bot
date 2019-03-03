import { Client } from 'irc';
import { getProcess } from './ghci'
import { readFileSync } from 'fs';


interface ConfigT {
  channels: string[];
  nick: string;
  server: string;
  stack: string;
};

const config: ConfigT = JSON.parse(readFileSync('config.json', 'utf8'));
let ghciChild = null;

const c = new Client(
   config.server, config.nick, {
      channels: config.channels,
   }
);

/*
 *  Returns any newline-terminated lines in "send", returns the remainder in buff.
 */
const splitString = (i: string): { send: string, buff: string } => {
  const matches = i.match(/^(.+\n\r?)([^\n\r]*)$/);
  if (matches === null) {
    return {
      buff: '',
      send: i,
    };
  }

  return {
    buff: matches[2],
    send: matches[1],
  };
};

const procHandler = (to: string) => {
  let pooledData = '';

  return (data: string) => {
    const { send, buff } = splitString(pooledData+data.toString());
    pooledData = buff;

    console.log(send);
    if (data.match(/^Prelude> ?$/)) {
      return;
    }

    c.say(to, send);
  }
};

c.addListener('message', (_, to, message) => {
  if (/^!start/.test(message)) {
    if (ghciChild === null) {
      ghciChild = getProcess(config.stack, procHandler(to));

      c.say(to, 'Started process.');
    } else {
      c.say(to, 'Process already started.');
    }
  } else if (/^!stop/.test(message)) {
    if (ghciChild === null) {
      c.say(to, 'Process not started.');
    } else {
      ghciChild.kill();
      ghciChild = null;
    }
  } else if (/^!hs\s+.+/.test(message)) {
    if (ghciChild === null) {
      ghciChild = getProcess(config.stack, procHandler(to));
    }

    const msg = message.substr(4);
    ghciChild.stdin.write(`${msg}\n`);
  }
});


c.addListener('error', (message) => {
    console.error('error: ', message);
});
