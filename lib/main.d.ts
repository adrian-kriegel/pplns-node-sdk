import axios from 'axios';
import { DataItemWrite, NodeRead } from '@pplns/schemas';
import { WorkerWrite, Worker, DataItemQuery } from '@pplns/schemas';
import { Static } from '@sinclair/typebox';
export declare type PipeApiConfig = Parameters<typeof axios.create>[0] & {
    query?: DataItemQuery;
};
export declare type WorkerDataType<IO extends 'inputs' | 'outputs', W extends Pick<Worker, IO>, C extends keyof W[IO]> = Static<W[IO][C]>;
export declare type WorkerOutputType<W extends Pick<Worker, 'outputs'>, C extends keyof W['outputs']> = WorkerDataType<'outputs', W, C>;
/**
 */
export default class PipelineApi {
    private client;
    /** @param config config */
    constructor({ ...axiosConfig }: PipeApiConfig);
    /**
     * Registers or updates the worker on the api.
     *
     * @param worker worker
     * @returns worker with _id
     */
    registerWorker(worker: WorkerWrite): Promise<Worker>;
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
}
/** */
export declare abstract class PipelineNode<W extends WorkerWrite = WorkerWrite> {
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
