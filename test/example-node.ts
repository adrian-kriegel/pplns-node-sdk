
import type {
  WorkerWrite,
} from '@pplns/schemas';
  
import { Type } from '@sinclair/typebox';
import { PipelineNode } from '../src/main';
  
/** Worker definition for the S3 worker. */
export class ExampleWorker
implements WorkerWrite
{
  key = 'example';

  title = 'Example.';

  description = 'Consumes inputs to produce outputs.';

  inputs = 
  {
    in0: Type.Object(
      { foo: Type.String() },
    ),
    in1: Type.Number(),
  };

  outputs =
  {
    out0: Type.String(),
    out1: Type.Object(
      {
        url: Type.String(),
      },
    ),
  };

  params = 
  {
    param0: Type.String(),
    param1: Type.Number(),
  }
}

/** */
export class ExampleNode
  extends PipelineNode<ExampleWorker>
{

}
