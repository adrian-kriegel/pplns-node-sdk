"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineNode = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 */
class PipelineApi {
    /** @param config config */
    constructor({ query = {}, ...axiosConfig }) {
        this.client = axios_1.default.create(axiosConfig);
        this.query = query;
    }
    /**
     * @param worker worker
     * @returns worker with _id
     */
    registerWorker(worker) {
        return this.client.put('/workers', worker);
    }
    /**
     * Creates data item or pushes data into existing item.
     * @param query query
     * @param item item
     * @returns Promise
     */
    postDataItem(query, item) {
        const searchParams = new URLSearchParams(
        // this basically just stringifies the ObjectIds
        Object.fromEntries(Object.entries(query)
            .filter(([, v]) => v)
            .map(([k, v]) => [k, '' + v])));
        return this.client.post('/outputs?' + searchParams.toString(), item);
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
        const response = await this.pipes.client.get(`/nodes/${this.nodeId}`);
        this.node = response.data;
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
        return this.pipes.client.post(`/nodes/${this.nodeId}/outputs`, item);
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
