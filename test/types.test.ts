
import { ExampleNode } from './util/example-data';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const dontrun = (_ : () => void) => null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const checkType = <T>(t : T) => null;

describe('[types] PipelineNode', () => 
{
  const node = new ExampleNode(
    '',
    null as any,
  );

  it('emit(item) only accepts valid items', () => 
  {
    dontrun(
      () => 
      {
        node.emit(
          {
            outputChannel: 'out0',
            done: true,
            data: ['a string'],
            consumptionId: null,
          },
        );

        node.emit(
          {
            outputChannel: 'out0',
            done: true,
            // @ts-expect-error
            data: [{ url: 'http://example.com' }],
          },
        );

        node.emit(
          {
            outputChannel: 'out1',
            done: true,
            data: [{ url: 'http://example.com' }],
            consumptionId: null,
          },
        );

        node.emit(
          {
            outputChannel: 'out1',
            done: true,
            // @ts-expect-error
            data: ['a string'],
          },
        );

        node.emit(
          {
            // @ts-expect-error
            outputChannel: 'out-does-not-exist',
            done: true,
            data: ['a string'],
          },
        );

      },
    );
  });

  it('param(name) returns the correct type', () => 
  {
    dontrun(
      () => 
      {
        checkType<string>(node.param('param0'));

        checkType<number>(node.param('param1'));
        
        // @ts-expect-error
        checkType<string>(node.param('param1'));
        // @ts-expect-error
        checkType<number>(node.param('param0'));
        // @ts-expect-error
        node.param('param3');
      },
    );
  });
});
