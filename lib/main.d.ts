import axios from 'axios';
import { DataItemWrite, NodeRead, WorkerWrite, Worker, DataItemQuery } from '@pplns/schemas';
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
 */
export default class PipelineApi {
    private client;
    private processor?;
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
    postDataItem(query: DataItemQuery, item: DataItemWrite): Promise<import("axios").AxiosResponse<any, any>>;
    /**
     * Sets the callback for processing incoming data.
     * @param callback callback function
     * @returns void
     */
    onData(callback: NodeProcessor): void;
    /** @returns void */
    private listen;
    /** @returns void */
    close(): void;
}
/** */
export declare abstract class PipelineNode<W extends IWorker = IWorker> {
    private nodeId;
    private pipes;
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
    emit<Channel extends keyof W['outputs'] & string>(item: DataItemWrite<WorkerOutputType<W, Channel>, Channel>): Promise<import("axios").AxiosResponse<any, any>>;
    /**
     * @param name param name
     * @returns param value
     */
    param<ParamName extends keyof W['params'] & string>(name: ParamName): Static<W['params'][ParamName]>;
}
export {};
