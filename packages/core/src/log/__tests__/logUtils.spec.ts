import { DateTime } from 'luxon';

import { formatLog, formatTime } from '../logUtils';

describe('Log formatting', () => {
  const now = DateTime.local();
  const nowString = formatTime(now);

  it('parses a message', () => {
    expect(formatLog('hello world', null, { methodName: 'info', now })).toEqual([`hello world`]);
  });

  it('includes method name for Node.js', () => {
    expect(formatLog('hello world', null, { methodName: 'info', isNodeEnv: true, now })).toEqual([`info: hello world`]);
  });

  it('includes timestamp for Docker', () => {
    expect(formatLog('hello world', null, { methodName: 'info', formatLogsForDocker: true, now })).toEqual([
      `[${nowString}] info: hello world`
    ]);
  });

  it('includes metadata for Docker', () => {
    expect(formatLog('hello world', { foo: 'bar' }, { methodName: 'info', formatLogsForDocker: true, now })).toEqual([
      `[${nowString}] info: hello world {"foo":"bar"}`
    ]);
  });

  it('handles string as metadata for Docker', () => {
    expect(formatLog('hello world', 'foobar', { methodName: 'info', formatLogsForDocker: true, now })).toEqual([
      `[${nowString}] info: hello world {"data":"foobar"}`
    ]);
  });

  it('includes a logger name', () => {
    expect(
      formatLog('hello world', null, { logPrefix: 'alien', formatLogsForDocker: true, methodName: 'info', now })
    ).toEqual([`[${nowString}] info: [alien] hello world`]);
  });
});
