import AminoClient from "aminoclient";
import * as Debug from "debug";
const debug = Debug("AminoBot:Community");
import * as AminoTypes from "aminoclient/dist/AminoTypes";
import Threads from "./Threads";

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default class Community {
    // Polled results
    public info: AminoTypes.IAminoCommunity;

    private pollingInterval: number = 5000;
    private initListener?: (community: Community, error: Error | null) => void;

    private ndcId: number;
    public threads: Threads;
    constructor(ndcId: number, listener: (community: Community, error: Error | null) => void) {
        this.ndcId = ndcId;
        this.info = {} as AminoTypes.IAminoCommunity;
        this.threads = new Threads(ndcId);
        this.initListener = listener;
        this.longPolling();
    }

    private async longPolling() {
        // Polling logic here
        debug(`Polling start`);

        // precall threads polling
        if (!this.threads.isReady)
            await this.threads.init();

        // Not sure how to make a good looking Await promise all, so I followed this gist
        // https://gist.github.com/indiesquidge/5960274889e17102b5130e8bd2ce9002 "cstroliadavis" comment
        const pGetCommunityInfo = AminoClient.getCommunityInfo(this.ndcId);

        // Promise all
        const communityInfo = await pGetCommunityInfo;
        this.info = communityInfo.community;

        debug(`Polling end`);
        if (this.initListener) {
            this.initListener(this, null);
            delete this.initListener;
        }
        await sleep(this.pollingInterval);
        this.longPolling();
    }
    public on(event: string, listener: () => void) {
        // On it
    }
    private emit(event: string, message: any) {
        // On it
    }
}