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
    private listenThreads: Thread[] = [];
    public joinedThreads: AminoTypes.IAminoThread[] = [];
    public publicThreads: AminoTypes.IAminoThread[] = [];
    private pollingInterval: number = 5000;
    public isReady: boolean = false;
    private initListener?: () => void;
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
        const pGetPublicThreads = AminoClient.getPublicChats(this.ndcId, 0, 15); // Contains joined chats, what about that?

        // Promise all
        this.joinedThreads = await pGetJoinedThreads;
        this.publicThreads = await pGetPublicThreads;

        debug(`Polling end`);
        if (this.initListener) {
            this.initListener();
            delete this.initListener;
            this.isReady = true;
        }
        await sleep(this.pollingInterval);
        this.longPolling();
    }

    public joined(threadPattern: string | RegExp, listener: (thread: Thread, err: Error | null) => void) {
        debug("Joined pipe");
        const targetThread = this.joinedThreads.find((thread) => {
            debug(thread.title);
            if (threadPattern instanceof RegExp) {
                if (typeof thread.title !== "undefined" && thread.title.match(threadPattern)) return true;
            } else {
                if (thread.title !== null && thread.title === threadPattern) return true;
            }
            return false;
        });

        if (targetThread === undefined) {
            listener({} as Thread, new Error(`Thread not found. '${threadPattern}' can't be matched with any joined thread.`));
        } else {
            const thread = new Thread(this.ndcId, targetThread, listener.bind(this));
            this.listenThreads.push(thread);
        }
    }
}