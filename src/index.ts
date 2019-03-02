import { Client } from 'irc';
import { getProcess } from './ghci'

const config = {
  channels: ['##ircbottesting'],
  nick: 'ghci',
  server: 'irc.wobscale.website',
  stack: '/home/aaron/.local/bin/stack'
};

let ghciChild = null;

const c = new Client(
   config.server, config.nick, {
      channels: config.channels,
   }
);

const procHandler = (to: string) => (data: string) => {
  const st = data.toString();

  if (/^.?P.?r.?e.?l.?u.?d.?e.?>.?\s*/.test(st)) {
    return;
  }

  console.log(st);
  c.say(to, st);
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
