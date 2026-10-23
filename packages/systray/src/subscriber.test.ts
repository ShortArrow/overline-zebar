import { describe, expect, it } from 'vitest';
import type { SystrayOutput } from 'zebar';
import { createSystraySubscriber, type SystrayGroup } from './subscriber';

function fakeProvider() {
  const log: string[] = [];
  const groups: { emit(output: SystrayOutput): void; finishStop(): void }[] =
    [];

  const create = (): SystrayGroup => {
    const id = groups.length;
    const listeners: (() => void)[] = [];
    let release = () => {};
    const group: SystrayGroup = {
      outputMap: { systray: null },
      onOutput: (listener) => listeners.push(listener),
      stopAll: () => {
        log.push(`stop ${id}`);
        return new Promise<void>((resolve) => {
          release = () => {
            log.push(`stopped ${id}`);
            resolve();
          };
        });
      },
    };
    groups.push({
      emit: (output) => {
        group.outputMap.systray = output;
        listeners.forEach((listener) => listener());
      },
      finishStop: () => release(),
    });
    log.push(`create ${id}`);
    return group;
  };

  return { create, log, groups };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const output = (tooltip: string) =>
  ({ icons: [{ tooltip }] }) as unknown as SystrayOutput;

describe('createSystraySubscriber', () => {
  it('forwards every output of the group it starts', async () => {
    const provider = fakeProvider();
    const seen: (SystrayOutput | null)[] = [];

    createSystraySubscriber(provider.create)((value) => seen.push(value));
    await flush();
    provider.groups[0]!.emit(output('a'));

    expect(seen).toEqual([null, output('a')]);
  });

  it('stops the group on unsubscribe', async () => {
    const provider = fakeProvider();

    const unsubscribe = createSystraySubscriber(provider.create)(() => {});
    await flush();
    unsubscribe();
    await flush();

    expect(provider.log).toEqual(['create 0', 'stop 0']);
  });

  it('starts the next group only after the previous one has stopped', async () => {
    const provider = fakeProvider();
    const subscribe = createSystraySubscriber(provider.create);

    const first = subscribe(() => {});
    await flush();
    first();
    subscribe(() => {});
    await flush();
    expect(provider.log).toEqual(['create 0', 'stop 0']);

    provider.groups[0]!.finishStop();
    await flush();
    expect(provider.log).toEqual([
      'create 0',
      'stop 0',
      'stopped 0',
      'create 1',
    ]);
  });

  it('never starts a group unsubscribed before it began', async () => {
    const provider = fakeProvider();

    createSystraySubscriber(provider.create)(() => {})();
    await flush();

    expect(provider.log).toEqual([]);
  });
});
