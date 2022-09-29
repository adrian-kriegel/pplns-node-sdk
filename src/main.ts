
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

import {
  DataItemWrite,
  NodeRead,
  WorkerWrite,
  Worker,
  DataItemQuery,
  BundleQuery,
  BundleRead,
  DataItem,
} from '@pplns/schemas';

import { Static } from '@sinclair/typebox';
import { PreparedInput } from './input-stream';

export type PipeApiConfig = 
  Parameters<typeof axios.create>[0] & 
  { 
    apiKey: string,
  }
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

export type GetResponse<T> = 
{
  results: T[];
  total: number;
};

/** */
export class ApiError extends Error
{
  code : number;
  data : unknown;

  /**
   * 
   * @param code code
   * @param body response body
   */
  constructor(code : number, body : any)
  {
    const msg = typeof(body) === 'object' ? 
      body.msg || body.message : 
      JSON.stringify(body)
    ;

    super(
      body.data ? 
        msg + '\n Data:' + JSON.stringify(body.data, null, 2) : 
        msg,
    );

    this.code = code;

    this.data = body.data;
  }
}

/**
 * wraps around axios instance to handle all errors
 */
class HttpClientWrapper
{
  /** */
  constructor(
    private client : AxiosInstance,
    private headers : { [k: string]: string } = {},
  ) {}

  /**
   * @param url url
   * @returns response
   */
  get(url : string) 
  {
    return this.request('get', url);
  }

  /**
   * @param url url
   * @param body body
   * @returns response
   */
  post(url : string, body : any = {}) 
  {
    return this.request('post', url, body);
  }

  /**
   * @param url url
   * @param body body
   * @returns response
   */
  put(url : string, body : any = {}) 
  {
    return this.request('put', url, body);
  }

  /**
   * @param url url
   * @param body body
   * @returns response
   */
  patch(url : string, body : any) 
  {
    return this.request('patch', url, body);
  }

  /**
   * @param url url
   * @returns response
   */
  delete(url : string) 
  {
    return this.request('delete', url);
  }

  /**
   * 
   * @param method method
   * @param url url
   * @param body body
   * @returns axios request config
   */
  buildRequest(
    method: string,
    url: string,
    body : unknown,
  ) : AxiosRequestConfig
  {
    return {
      method,
      url,
      data: body,
      headers: 
      {
        'Content-Type': 'application/json',
        ...this.headers,
      },
    };
  }

  /**
   * @param method method
   * @param url url
   * @param body body
   * @returns response
   */
  async request(
    method : string,
    url : string,
    body?: unknown,
  )
  {
    let response : AxiosResponse;

    try 
    {
      response = await this.client.request(
        this.buildRequest(method, url, body),
      );
    }
    catch (e : any)
    {
      if (e.response)
      {
        response = e.response;
      }
      else 
      {
        throw e;
      }
    }

    if (response.status >= 200 && response.status < 300)
    {
      return response.data;
    }
    else 
    {
      throw new ApiError(response.status, response.data);
    }
  }
}

/**
 * Stringify a query string value.
 * @param v v
 * @returns JSON or raw string
 */
export function stringifyQueryValue(v : any)
{
  if (typeof(v) === 'object' && 'toJSON' in v)
  {
    return v.toJSON();
  }

  const res = JSON.stringify(v);

  return res.startsWith('"') ? ('' + v) : res;
}

/**
 * Removes undefined values and stringigies remaining values.
 * @param query query
 * @returns query stringified
 */
export function stringifyQuery(query : object)
{
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .map(([key, v]) => 
        [
          key,
          stringifyQueryValue(v),
        ],
      ),
  );
}

/**
 * Stringifies all values and builds URLSearchParams.
 * @param query query
 * @returns URLSearchParams
 */
export function buildSearchParams(
  query : object,
)
{
  return new URLSearchParams(stringifyQuery(query));
}

/**
 */
export default class PipelineApi
{
  public client : HttpClientWrapper;

  private registeredWorkers : {
    // maps worker._id to worker
    [key : string]: Worker
  } = {};

  /** @param config config */
  constructor(
    { apiKey, ...axiosConfig } : PipeApiConfig,
  )
  {
    this.client = new HttpClientWrapper(
      axios.create(axiosConfig),
      {
        'X-API-Key': apiKey,
      },
    ); 
  }

  /**
   * Registers or updates the worker on the api.
   * 
   * @param worker worker
   * @returns worker with _id
   */
  public async registerWorker(
    worker : IWorker,
  ) : Promise<Worker>
  {
    if (worker._id in this.registeredWorkers)
    {
      return this.registeredWorkers[worker._id];
    }

    const result = await this.client.put(
      '/workers/' + worker._id,
      worker,
    );

    this.registeredWorkers[worker._id] = result;

    return result;
  }

  /**
   * @param nodeId node id
   * @returns node from api
   */
  public async getNode(nodeId : string)
  {
    return this.client.get(
      `/nodes/${nodeId}`,
    );
  }

  /**
   * Creates data item or pushes data into existing item.
   * @param query query
   * @param item item
   * @returns Promise
   */
  public emit<
    W extends IWorker = any, 
    Channel extends keyof W['outputs'] & string = any
  >(
    query : DataItemQuery,
    item : DataItemWrite<WorkerOutputType<W, Channel>, Channel>,
  )
  {
    return this.client.post(
      '/outputs?' + buildSearchParams(query),
      item,
    );
  }

  /**
   * @param query query
   * @returns GetResponse
   */
  public getDataItems(
    query : DataItemQuery,
  ) : Promise<GetResponse<DataItem>>
  {
    return this.client.get('/outputs?' + buildSearchParams(query));
  }

  /**
   * @param query query
   * @returns bundles
   */
  public async consume(
    query : BundleQuery = {},
  ) : Promise<BundleRead[]>
  {
    const { results } = await this.client.get(
      '/bundles?' + buildSearchParams(
        {
          consume: true,
          ...query,
        },
      ),
    );

    return results;
  }

  /**
   * Undo consuming a bundle. Makes the bundle available again.
   * @param taskId taskId
   * @param bundleId bundleId
   * @param consumptionId consumptionId
   * @returns void
   */
  public unconsume(
    taskId : string,
    bundleId : string,
    consumptionId : string,
  ) : Promise<void>
  {
    return this.client.put(
      '/bundles/' + bundleId + '?' + buildSearchParams(
        { taskId },
      ),
      { consumptionId },
    );
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
  public constructor(
    public readonly nodeId : string,
    public readonly pipes : PipelineApi,
  ) {}

  /**
   * @returns Promise<NodeRead>
   */
  public async load()
  {
    this.node = await this.pipes.getNode(this.nodeId);

    return this;
  }

  /** @returns node from api */
  public get() : NodeRead
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
  public emit<Channel extends keyof W['outputs'] & string>(
    item : DataItemWrite<WorkerOutputType<W, Channel>, Channel>,
  )
  {
    return this.pipes.emit(
      {
        nodeId: this.nodeId,
        taskId: this.get().taskId,
      },
      item,
    );  
  }

  /**
   * @param name param name
   * @returns param value
   */
  public param<ParamName extends keyof W['params'] & string>(
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
