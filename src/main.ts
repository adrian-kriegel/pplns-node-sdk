
import axios, { AxiosInstance } from 'axios';

import {
  DataItemWrite,
  NodeRead,
} from '@pplns/schemas';

import {
  WorkerWrite,
  Worker,
  DataItemQuery,
  DataItem,
} from '@pplns/schemas';

import { Static } from '@sinclair/typebox';

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
  C extends keyof W['outputs']
> = WorkerDataType<'outputs', W, C>;


/**
 */
export default class PipelineApi
{
  client : AxiosInstance;

  query : DataItemQuery;

  /** @param config config */
  constructor(
    { query = {}, ...axiosConfig } : PipeApiConfig,
  )
  {
    this.client = axios.create(axiosConfig); 

    this.query = query;
  }

  /**
   * @param worker worker
   * @returns worker with _id
   */
  registerWorker(
    worker : WorkerWrite,
  ) : Promise<Worker>
  {
    return this.client.put(
      '/workers',
      worker,
    );
  }

  /**
   * Creates data item or pushes data into existing item.
   * @param query query
   * @param item item
   * @returns Promise
   */
  postDataItem(
    query : DataItemQuery,
    item : DataItem,
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
}

/** */
export abstract class PipelineNode<
  W extends WorkerWrite = WorkerWrite,
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
    const response = await this.pipes.client.get(
      `/nodes/${this.nodeId}`,
    );

    this.node = response.data;

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
  emit<Channel extends keyof W['outputs']>(
    item : DataItemWrite<WorkerOutputType<W, Channel>, Channel>,
  )
  {
    return this.pipes.client.post(
      `/nodes/${this.nodeId}/outputs`,
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