
import axios, { AxiosInstance } from 'axios';

import {
  DataItemWrite,
  NodeRead,
  WorkerWrite,
  Worker,
  DataItemQuery,
} from '@pplns/schemas';

import { Static } from '@sinclair/typebox';
import { PreparedInput } from './input-stream';

export type PipeApiConfig = 
  Parameters<typeof axios.create>[0] & 
  { query?: DataItemQuery }
;

// input/output data type of a worker
export type WorkerDataType<
  IO extends 'inputs' | 'outputs',
  W extends Pick<Worker, IO>,
  C extends keyof W[IO]
> = Static<W[IO][C]>;

// output data type of a worker
export type WorkerOutputType<
  W extends Pick<Worker, 'outputs'>,
  C extends keyof W['outputs'] = keyof W['outputs']
> = WorkerDataType<'outputs', W, C>;

// output data type of a worker
export type WorkerInputType<
  W extends Pick<Worker, 'inputs'>,
  C extends keyof W['inputs'] = keyof W['inputs']
> = WorkerDataType<'inputs', W, C>;


type OptionalPromise<T> = Promise<T> | T;

export type IWorker = WorkerWrite;

export type NodeProcessor<
  W extends IWorker = IWorker
> = 
  (d : PreparedInput<W>) => OptionalPromise<
    {
      [Channel in keyof W['outputs']]: DataItemWrite<
        WorkerOutputType<W, Channel>, Channel
      >
    } | void
  >
;

/**
 */
export default class PipelineApi
{
  private client : AxiosInstance;

  private processor?: NodeProcessor;

  /** @param config config */
  constructor(
    { ...axiosConfig } : PipeApiConfig,
  )
  {
    this.client = axios.create(axiosConfig); 
  }

  /**
   * Registers or updates the worker on the api.
   * 
   * @param worker worker
   * @returns worker with _id
   */
  public registerWorker(
    worker : IWorker,
  ) : Promise<Worker>
  {
    return this.client.put(
      '/workers',
      worker,
    );
  }

  /**
   * @param nodeId node id
   * @returns node from api
   */
  public async getNode(nodeId : string)
  {
    return (await this.client.get(
      `/nodes/${nodeId}`,
    )).data;
  }

  /**
   * Creates data item or pushes data into existing item.
   * @param query query
   * @param item item
   * @returns Promise
   */
  public postDataItem(
    query : DataItemQuery,
    item : DataItemWrite,
  )
  {
    const searchParams = new URLSearchParams(
      // this basically just stringifies the ObjectIds
      Object.fromEntries(
        Object.entries(query)
          .filter(([, v]) => v)
          .map(([k, v]) => [k, '' + v]),
      ),
    );

    return this.client.post(
      '/outputs?' + searchParams.toString(),
      item,
    );
  }

  /**
   * Sets the callback for processing incoming data.
   * @param callback callback function
   * @returns void
   */
  public onData(
    callback : NodeProcessor,
  )
  {
    if (this.processor)
    {
      throw new Error('There can be only one processor per instance.');
    }

    this.processor = callback;

    this.listen();
  }

  /** @returns void */
  private listen()
  {
    // TODO: implement
  }

  /** @returns void */
  public close()
  {
    // TODO: implement
  }
}

/** */
export abstract class PipelineNode<
  W extends IWorker = IWorker,
>
{
  private node : NodeRead | null = null;

  /**
   * @param nodeId nodeId
   * @param pipes pipes api
   */
  constructor(
    private nodeId : string,
    private pipes : PipelineApi,
  ) {}

  /**
   * @returns Promise<NodeRead>
   */
  async load()
  {
    this.node = await this.pipes.getNode(this.nodeId);

    return this;
  }

  /** @returns node from api */
  get() : NodeRead
  {
    if (this.node)
    {
      return this.node;
    }
    else 
    {
      throw new Error('[PipelineNode] Please call load() before get().');
    }
  }

  /**
   * @param item item to emit
   * @returns Promise
   */
  emit<Channel extends keyof W['outputs'] & string>(
    item : DataItemWrite<WorkerOutputType<W, Channel>, Channel>,
  )
  {
    return this.pipes.postDataItem(
      { nodeId: this.nodeId },
      item,
    );  
  }

  /**
   * @param name param name
   * @returns param value
   */
  param<ParamName extends keyof W['params'] & string>(
    name : ParamName,
  ) : Static<W['params'][ParamName]>
  {
    const params = this.get().params;

    if (params && name in params)
    {
      return params[name] as any;
    }
    else 
    {
      throw new TypeError(
        `[PipelineNode] Missing parameter ${name} in node`,
      );
    }
  }
}
