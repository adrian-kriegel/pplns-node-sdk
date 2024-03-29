/// <reference types="node" />
import { Readable } from 'stream';
import { BundleQuery, BundleRead, DataItem } from '@pplns/schemas';
import { IWorker, WorkerInputType } from './main';
export declare type PreparedInput<W extends IWorker, B extends Pick<BundleRead, 'items' | 'inputItems'> = BundleRead> = {
    bundle: B;
    inputs: {
        [Channel in keyof W['inputs']]: DataItem<WorkerInputType<W, Channel>, string>;
    };
};
/**
 * @param bundle bundle
 * @returns prepared bundle
 */
export declare function prepareBundle<W extends IWorker, B extends Pick<BundleRead, 'items' | 'inputItems'> = BundleRead>(bundle: B): PreparedInput<W, B>;
declare type Interval = ReturnType<typeof setInterval>;
/**
 * Listens for new input bundles from the api.
 *
 * WORK IN PROGRESS
 */
export default class DataInputStream<W extends IWorker = IWorker> extends Readable {
    private query;
    private maxConurrency;
    private pollingTime;
    interval?: Interval;
    activeCallbacks: number;
    /**
     *
     * @param query query
     * @param maxConurrency max. concurrent emissions
     * @param pollingTime polling interval in ms
     */
    constructor(query: BundleQuery, maxConurrency?: number, pollingTime?: number);
    /**
     * @param event event
     * @param callback callback
     * @returns same as Readable.on
     */
    on<Event extends string>(event: Event, callback: Event extends 'data' ? ((data: PreparedInput<W>) => void) : (Parameters<Readable['on']>[1])): this;
    /**
     * Starts listening for inputs.
     * @returns this
     */
    start(): this;
    /**
     * @returns this
     */
    pause(): this;
    /**
     *
     * @returns this
     */
    resume(): this;
    /** @returns boolean */
    close(): boolean;
}
export {};
