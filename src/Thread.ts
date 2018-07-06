import AminoClient from "aminoclient";
import * as AminoTypes from "aminoclient/dist/AminoTypes";
import * as Debug from "debug";
const debug = Debug("AminoBot:Thread");
import * as Moment from "moment";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface IMessage extends AminoTypes.IAminoMessage {
    original: AminoTypes.IAminoMessage;
    send: (msg: string) => Promise<void>;
}

export default class Thread {
    private ndcId: number;
    private initListener: ((thread: Thread, error: Error | null) => void) | null = null;
    private pollingInterval: number = 2500;
    private onMessageListener: Map<string | RegExp, (community: IMessage) => void> = new Map();
    private lastMessageDate: Moment.Moment = Moment(0);
    public IsDead: boolean = false;
    // private onMessageListener: (communityPattern: string | RegExp, listener: (community: IMessage) => void;
    public info: AminoTypes.IAminoThread;
    constructor(ndcId: number, thread: AminoTypes.IAminoThread, listener: (thread: Thread, error: Error | null) => void) {
        this.ndcId = ndcId;
        this.info = thread;
        this.initListener = listener;
        this.longPolling();
    }

    private async longPolling() {
        debug(`Polling start`);
        let pGetThreadMessages;
        try {
            pGetThreadMessages = AminoClient.getThreadMessages(this.ndcId, this.info.threadId, 0, 50); // This is shit

            // Promise all
            const threadMessages = await pGetThreadMessages;
            threadMessages.reverse();

            if (this.lastMessageDate.isSame(Moment(0)))
                this.lastMessageDate = Moment(threadMessages[threadMessages.length - 1].createdTime);

            for (const message of threadMessages) {
                if (this.lastMessageDate.isBefore(Moment(message.createdTime))) {
                    this.lastMessageDate = Moment(message.createdTime);
                    this.emitMessage(message);
                }
            }

            debug(`Polling end`);
            if (this.initListener) {
                this.initListener(this, null);
                delete this.initListener;
            }
            await sleep(this.pollingInterval);
            this.longPolling();
        } catch (e) {
            // Failed, maybe its dead, stop thread polling and mark it as dead
            this.IsDead = true;
        }
    }

    private emitMessage(message: AminoTypes.IAminoMessage) {
        if (message.content === null) return;
        const resp: IMessage = {
            ...message,
            original: message,
            send: async (msg: string) => {
                AminoClient.sendMessageInThread(this.ndcId, this.info.threadId, msg);
            }
        };

        // Check for match all key
        const listener = this.onMessageListener.get("*");
        if (listener !== undefined)
            listener(resp);

        for (const [messagePattern, onMessage] of this.onMessageListener) {
            if (messagePattern instanceof RegExp) {
                if (message.content !== undefined && message.content.match(messagePattern)) onMessage(resp);
            } else {
                if (message.content !== undefined && message.content === messagePattern) onMessage(resp);
            }
        }
    }

    public onMessage(messagePattern: string | RegExp, listener: (community: IMessage) => void) {
        this.onMessageListener.set(messagePattern, listener);
    }

    public sendMessage(msg: string) {
        AminoClient.sendMessageInThread(this.ndcId, this.info.threadId, msg);
    }
}