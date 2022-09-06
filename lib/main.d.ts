import axios, { AxiosInstance } from 'axios';
import { DataItemWrite, NodeRead, WorkerWrite, Worker, DataItemQuery, BundleQuery, BundleRead } from '@pplns/schemas';
import { Static } from '@sinclair/typebox';
import { PreparedInput } from './input-stream';
export declare type PipeApiConfig = Parameters<typeof axios.create>[0] & {
    query?: DataItemQuery;
};
export declare type WorkerDataType<IO extends 'inputs' | 'outputs', W extends Pick<Worker, IO>, C extends keyof W[IO]> = Static<W[IO][C]>;
export declare type WorkerOutputType<W extends Pick<Worker, 'outputs'>, C extends keyof W['outputs'] = keyof W['outputs']> = WorkerDataType<'outputs', W, C>;
export declare type WorkerInputType<W extends Pick<Worker, 'inputs'>, C extends keyof W['inputs'] = keyof W['inputs']> = WorkerDataType<'inputs', W, C>;
declare type OptionalPromise<T> = Promise<T> | T;
export declare type IWorker = WorkerWrite;
export declare type NodeProcessor<W extends IWorker = IWorker> = (d: PreparedInput<W>) => OptionalPromise<{
    [Channel in keyof W['outputs']]: DataItemWrite<WorkerOutputType<W, Channel>, Channel>;
} | void>;
/**
 * wraps around axios instance to handle all errors
 */
declare class HttpClientWrapper {
    private client;
    /** */
    constructor(client: AxiosInstance);
    /**
     * @param url url
     * @returns response
     */
    get(url: string): Promise<any>;
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    post(url: string, body?: any): Promise<any>;
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    put(url: string, body?: any): Promise<any>;
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    patch(url: string, body: any): Promise<any>;
    /**
     * @param url url
     * @returns response
     */
    delete(url: string): Promise<any>;
    /**
     * @param method method
     * @param url url
     * @param body body
     * @returns response
     */
    request(method: string, url: string, body?: any): Promise<any>;
}
/**
 * Stringify a query string value.
 * @param v v
 * @returns JSON or raw string
 */
export declare function stringifyQueryValue(v: any): any;
/**
 * Removes undefined values and stringigies remaining values.
 * @param query query
 * @returns query stringified
 */
export declare function stringifyQuery(query: object): {
    [k: string]: string;
};
/**
 * Stringifies all values and builds URLSearchParams.
 * @param query query
 * @returns URLSearchParams
 */
export declare function buildSearchParams(query: object): URLSearchParams;
/**
 */
export default class PipelineApi {
    client: HttpClientWrapper;
    private registeredWorkers;
    /** @param config config */
    constructor({ ...axiosConfig }: PipeApiConfig);
    /**
     * Registers or updates the worker on the api.
     *
     * @param worker worker
     * @returns worker with _id
     */
    registerWorker(worker: IWorker): Promise<Worker>;
    /**
     * @param nodeId node id
     * @returns node from api
     */
    getNode(nodeId: string): Promise<any>;
    /**
     * Creates data item or pushes data into existing item.
     * @param query query
     * @param item item
     * @returns Promise
     */
    emit(query: DataItemQuery, item: DataItemWrite): Promise<any>;
    /**
     * @param query query
     * @returns bundles
     */
    consume(query?: BundleQuery): Promise<BundleRead[]>;
    /**
     * Undo consuming a bundle. Makes the bundle available again.
     * @param taskId taskId
     * @param bundleId bundleId
     * @returns void
     */
    unconsume(taskId: string, bundleId: string): Promise<void>;
}
/** */
export declare abstract class PipelineNode<W extends IWorker = IWorker> {
    readonly nodeId: string;
    readonly pipes: PipelineApi;
    private node;
    /**
     * @param nodeId nodeId
     * @param pipes pipes api
     */
    constructor(nodeId: string, pipes: PipelineApi);
    /**
     * @returns Promise<NodeRead>
     */
    load(): Promise<this>;
    /** @returns node from api */
    get(): NodeRead;
    /**
     * @param item item to emit
     * @returns Promise
     */
    emit<Channel extends keyof W['outputs'] & string>(item: DataItemWrite<WorkerOutputType<W, Channel>, Channel>): Promise<any>;
    /**
     * @param name param name
     * @returns param value
     */
    param<ParamName extends keyof W['params'] & string>(name: ParamName): Static<W['params'][ParamName]>;
}
export {};
