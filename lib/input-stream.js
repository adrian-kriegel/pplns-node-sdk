"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepareBundle = void 0;
const stream_1 = require("stream");
/**
 * @param bundle bundle
 * @returns prepared bundle
 */
function prepareBundle(bundle) {
    return {
        bundle,
        inputs: Object.fromEntries(bundle.inputItems.map((item) => [
            item.inputChannel,
            bundle.items.find(({ _id }) => _id === item.itemId),
        ])),
    };
}
exports.prepareBundle = prepareBundle;
/**
 * Listens for new input bundles from the api.
 *
 * WORK IN PROGRESS
 */
class DataInputStream extends stream_1.Readable {
    /**
     *
     * @param query query
     * @param maxConurrency max. concurrent emissions
     * @param pollingTime polling interval in ms
     */
    constructor(query, maxConurrency = 10, pollingTime = 500) {
        super();
        this.query = query;
        this.maxConurrency = maxConurrency;
        this.pollingTime = pollingTime;
        this.activeCallbacks = 0;
    }
    /**
     * @param event event
     * @param callback callback
     * @returns same as Readable.on
     */
    on(event, callback) {
        if (event === 'data') {
            return super.on(event, async (data) => {
                try {
                    if (++this.activeCallbacks >= this.maxConurrency) {
                        this.pause();
                    }
                    await callback(data);
                }
                catch (e) {
                    this.emit('error', e);
                }
                finally {
                    if (this.activeCallbacks-- <= this.maxConurrency) {
                        this.resume();
                    }
                }
            });
        }
        else {
            return super.on(event, callback);
        }
    }
    /**
     * Starts listening for inputs.
     * @returns this
     */
    start() {
        var _a;
        (_a = this.interval) !== null && _a !== void 0 ? _a : (this.interval = setInterval(() => {
            // TODO: implement
        }, this.pollingTime));
        return this;
    }
    /**
     * @returns this
     */
    pause() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        return this;
    }
    /**
     *
     * @returns this
     */
    resume() {
        return this.start();
    }
    /** @returns boolean */
    close() {
        this.pause();
        return super.emit('close');
    }
}
exports.default = DataInputStream;
