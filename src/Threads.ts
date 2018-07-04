import AminoClient from "aminoclient";
import * as Debug from "debug";
const debug = Debug("AminoBot:Threads");
import * as AminoTypes from "aminoclient/dist/AminoTypes";
import Thread from "./Thread";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class Threads {
    private ndcId: number;
    private listenThreads: Map<string, Thread> = new Map();
    public joinedThreads: AminoTypes.IAminoThread[] = [];
    public publicThreads: AminoTypes.IAminoThread[] = [];
    private pollingInterval: number = 5000;
    public isReady: boolean = false;
    private initListener?: () => void;
    private onHandlers: Array<() => void> = [];
    constructor(ndcId: number) {
        this.ndcId = ndcId;
    }

    public async init() {
        return new Promise((resolve) => {
            this.initListener = resolve;
            this.longPolling();
        });
    }

    private async longPolling() {
        debug(`Polling start`);
        const pGetJoinedThreads = AminoClient.getJoinedChats(this.ndcId, 0, 15 /* Ugly, what if more than 15? */);
        const pGetPublicThreads = AminoClient.getPublicChats(this.ndcId, 0, 15);

        // Promise all
        this.joinedThreads = await pGetJoinedThreads;
        this.publicThreads = await pGetPublicThreads;

        debug(`Polling end`);
        if (this.initListener) {
            this.initListener();
            delete this.initListener;
            this.isReady = true;
        }

        this.destroyDeadThreads(); // Destroy deprecated threads
        this.onHandlers.forEach((onHandler) => onHandler()); // Update if there is any new thread

        await sleep(this.pollingInterval);
        this.longPolling();
    }

    private destroyDeadThreads() {
        this.listenThreads.forEach((thread, key) => {
            if (thread.IsDead)
                this.listenThreads.delete(key);
        });
    }

    public on(threadPattern: string | RegExp, joinedThreadsOnly: boolean, listener: (thread: Thread, err: Error | null) => void) {
        this.onHandlers.push(() => {
            debug("Joined pipe");
            const threads = joinedThreadsOnly ? this.joinedThreads : this.publicThreads;

            const targetThreads = threads.filter((thread) => {
                debug(thread.title);
                if (threadPattern instanceof RegExp) {
                    if (typeof thread.title !== "undefined" && thread.title.match(threadPattern)) return true;
                } if (threadPattern === "*") {
                    return true;
                } else {
                    if (thread.title !== null && thread.title === threadPattern) return true;
                }
                return false;
            });

            if (targetThreads.length === 0) {
                listener({} as Thread, new Error(`Thread not found. '${threadPattern}' can't be matched with any joined thread.`));
            } else {
                for (const targetThread of targetThreads) {
                    if (!this.listenThreads.has(targetThread.threadId)) {
                        const thread = new Thread(this.ndcId, targetThread, listener.bind(this));
                        this.listenThreads.set(targetThread.threadId, thread);
                    }
                }
            }
        });
        this.onHandlers[this.onHandlers.length - 1]();
    }
}