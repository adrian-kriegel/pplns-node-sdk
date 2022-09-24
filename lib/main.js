"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineNode = exports.buildSearchParams = exports.stringifyQuery = exports.stringifyQueryValue = exports.ApiError = void 0;
const axios_1 = __importDefault(require("axios"));
/** */
class ApiError extends Error {
    /**
     *
     * @param code code
     * @param body response body
     */
    constructor(code, body) {
        const msg = typeof (body) === 'object' ?
            body.msg || body.message :
            JSON.stringify(body);
        super(body.data ?
            msg + '\n Data:' + JSON.stringify(body.data, null, 2) :
            msg);
        this.code = code;
        this.data = body.data;
    }
}
exports.ApiError = ApiError;
/**
 * wraps around axios instance to handle all errors
 */
class HttpClientWrapper {
    /** */
    constructor(client) {
        this.client = client;
    }
    /**
     * @param url url
     * @returns response
     */
    get(url) {
        return this.request('get', url);
    }
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    post(url, body = {}) {
        return this.request('post', url, body);
    }
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    put(url, body = {}) {
        return this.request('put', url, body);
    }
    /**
     * @param url url
     * @param body body
     * @returns response
     */
    patch(url, body) {
        return this.request('patch', url, body);
    }
    /**
     * @param url url
     * @returns response
     */
    delete(url) {
        return this.request('delete', url);
    }
    /**
     * @param method method
     * @param url url
     * @param body body
     * @returns response
     */
    async request(method, url, body) {
        let response;
        try {
            response = await this.client.request({
                method,
                url,
                data: body,
            });
        }
        catch (e) {
            if (e.response) {
                response = e.response;
            }
            else {
                throw e;
            }
        }
        if (response.status >= 200 && response.status < 300) {
            return response.data;
        }
        else {
            throw new ApiError(response.status, response.data);
        }
    }
}
/**
 * Stringify a query string value.
 * @param v v
 * @returns JSON or raw string
 */
function stringifyQueryValue(v) {
    if (typeof (v) === 'object' && 'toJSON' in v) {
        return v.toJSON();
    }
    const res = JSON.stringify(v);
    return res.startsWith('"') ? ('' + v) : res;
}
exports.stringifyQueryValue = stringifyQueryValue;
/**
 * Removes undefined values and stringigies remaining values.
 * @param query query
 * @returns query stringified
 */
function stringifyQuery(query) {
    return Object.fromEntries(Object.entries(query)
        .filter(([, v]) => v !== undefined)
        .map(([key, v]) => [
        key,
        stringifyQueryValue(v),
    ]));
}
exports.stringifyQuery = stringifyQuery;
/**
 * Stringifies all values and builds URLSearchParams.
 * @param query query
 * @returns URLSearchParams
 */
function buildSearchParams(query) {
    return new URLSearchParams(stringifyQuery(query));
}
exports.buildSearchParams = buildSearchParams;
/**
 */
class PipelineApi {
    /** @param config config */
    constructor({ ...axiosConfig }) {
        this.registeredWorkers = {};
        this.client = new HttpClientWrapper(axios_1.default.create(axiosConfig));
    }
    /**
     * Registers or updates the worker on the api.
     *
     * @param worker worker
     * @returns worker with _id
     */
    async registerWorker(worker) {
        if (worker._id in this.registeredWorkers) {
            return this.registeredWorkers[worker._id];
        }
        const result = await this.client.put('/workers/' + worker._id, worker);
        this.registeredWorkers[worker._id] = result;
        return result;
    }
    /**
     * @param nodeId node id
     * @returns node from api
     */
    async getNode(nodeId) {
        return this.client.get(`/nodes/${nodeId}`);
    }
    /**
     * Creates data item or pushes data into existing item.
     * @param query query
     * @param item item
     * @returns Promise
     */
    emit(query, item) {
        return this.client.post('/outputs?' + buildSearchParams(query), item);
    }
    /**
     * @param query query
     * @returns GetResponse
     */
    getDataItems(query) {
        return this.client.get('/outputs?' + buildSearchParams(query));
    }
    /**
     * @param query query
     * @returns bundles
     */
    async consume(query = {}) {
        const { results } = await this.client.get('/bundles?' + buildSearchParams({
            consume: true,
            ...query,
        }));
        return results;
    }
    /**
     * Undo consuming a bundle. Makes the bundle available again.
     * @param taskId taskId
     * @param bundleId bundleId
     * @returns void
     */
    unconsume(taskId, bundleId) {
        return this.client.put('/bundles/' + bundleId + '?' + buildSearchParams({ taskId }));
    }
}
exports.default = PipelineApi;
/** */
class PipelineNode {
    /**
     * @param nodeId nodeId
     * @param pipes pipes api
     */
    constructor(nodeId, pipes) {
        this.nodeId = nodeId;
        this.pipes = pipes;
        this.node = null;
    }
    /**
     * @returns Promise<NodeRead>
     */
    async load() {
        this.node = await this.pipes.getNode(this.nodeId);
        return this;
    }
    /** @returns node from api */
    get() {
        if (this.node) {
            return this.node;
        }
        else {
            throw new Error('[PipelineNode] Please call load() before get().');
        }
    }
    /**
     * @param item item to emit
     * @returns Promise
     */
    emit(item) {
        return this.pipes.emit({
            nodeId: this.nodeId,
            taskId: this.get().taskId,
        }, item);
    }
    /**
     * @param name param name
     * @returns param value
     */
    param(name) {
        const params = this.get().params;
        if (params && name in params) {
            return params[name];
        }
        else {
            throw new TypeError(`[PipelineNode] Missing parameter ${name} in node`);
        }
    }
}
exports.PipelineNode = PipelineNode;
