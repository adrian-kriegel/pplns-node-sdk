
import { Readable } from 'stream';

import {
  BundleQuery,
  BundleRead,
  DataItem,
} from '@pplns/schemas';

import {
  IWorker,
  WorkerInputType,
} from './main';


export type PreparedInput<
  W extends IWorker,
  B extends Pick<BundleRead, 'items'| 'inputItems'> = BundleRead
> =
{
  bundle: B;
  inputs:
  {
    [Channel in keyof W['inputs']]: DataItem<
      WorkerInputType<W, Channel>, string
    >;
  };
};

/**
 * @param bundle bundle
 * @returns prepared bundle
 */
export function prepareBundle<
  W extends IWorker, 
  B extends Pick<BundleRead, 'items'| 'inputItems'> = BundleRead
>(bundle : B) : PreparedInput<W, B>
{
  return {
    bundle,
    inputs: Object.fromEntries(
      bundle.inputItems.map(
        (item) => [
          item.inputChannel,
          bundle.items.find(({_id}) => _id === item.itemId),
        ],
      ),
    ) as any,
  };
}

type Interval = ReturnType<typeof setInterval>;

/**
 * Listens for new input bundles from the api.
 * 
 * WORK IN PROGRESS 
 */
export default class DataInputStream<
  W extends IWorker = IWorker
> extends Readable
{
  interval?: Interval;

  activeCallbacks = 0;

  /**
   * 
   * @param query query
   * @param maxConurrency max. concurrent emissions
   * @param pollingTime polling interval in ms
   */
  constructor(
    private query : BundleQuery,
    private maxConurrency = 10,
    private pollingTime = 500,
  )
  {
    super();
  }

  /**
   * @param event event
   * @param callback callback
   * @returns same as Readable.on
   */
  on<Event extends string>(
    event : Event,
    callback : Event extends 'data' ? 
      ((data : PreparedInput<W>) => void) : 
      (Parameters<Readable['on']>[1]),
  )
  {
    if (event === 'data')
    {
      return super.on(event, async (data) =>
      {
        try 
        {
          if (
            ++this.activeCallbacks >= this.maxConurrency
          )
          {
            this.pause();
          }

          await callback(data);
        }
        catch (e)
        {
          this.emit('error', e);
        }
        finally 
        {
          if (this.activeCallbacks-- <= this.maxConurrency)
          {
            this.resume();
          }
        }
      });
    }
    else 
    {
      return super.on(event, callback);
    }
  }

  /**
   * Starts listening for inputs.
   * @returns this
   */
  start()
  {
    this.interval ??= setInterval(
      () => 
      {
        // TODO: implement
      },
      this.pollingTime,
    );

    return this;
  }

  /**
   * @returns this
   */
  pause()
  {
    if (this.interval)
    {
      clearInterval(this.interval);
    }

    return this;
  }

  /**
   * 
   * @returns this
   */
  resume()
  {
    return this.start();
  }

  /** @returns boolean */
  close()
  {
    this.pause();

    return super.emit('close');
  }
}
