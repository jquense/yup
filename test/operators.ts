import { string } from '../src';
import { sequence } from '../src/operators/sequence';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('operators - sequence', () => {
  it('resolves in sequence', async () => {
    let i = 0;

    await string()
      .test(
        sequence((s) =>
          s
            .test(async () => {
              i++;
              await sleep(5);
              return true;
            })
            .min('3')
            .test(async () => {
              if (i === 1) i++;

              await sleep(10);
              return true;
            })
            .test(() => {
              if (i === 2) i++;
              return true;
            }),
        ),
      )
      .validate('');

    expect(i).toEqual(3);
  });

  it('rejects on first error', async () => {
    let i = 0;

    await expect(
      string()
        .test(
          sequence((s) =>
            s
              .test(async () => {
                i++;
                await sleep(5);
                return true;
              })
              .test(async (_, ctx) => {
                await sleep(10);
                return ctx.createError({ message: 'Second threw' });
              })
              .test(() => {
                if (i === 2) i++;
                return true;
              }),
          ),
        )
        .validate(''),
    ).rejects.toThrowError('Second threw');

    expect(i).toEqual(1);
  });
});
