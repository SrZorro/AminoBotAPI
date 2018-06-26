import AminoClient from "aminoclient";
import * as Debug from "debug";
const debug = Debug("AminoBot:main");

import Community from "./Community";

interface ICommunities {
    communityList: Array<{
        name: string;
        endpoint: string;
        ndcId: number;
    }>;
    on: (event: string | RegExp, listener: (community: Community, err: Error | null) => void) => void;
}
export default class AminoBot {
    private username: string;
    private password: string;
    private deviceID: string;
    private listenCommunities: Community[] = [];
    constructor(username: string, password: string, deviceID: string) {
        this.username = username;
        this.password = password;
        this.deviceID = deviceID;
    }
    public async onLogin(): Promise<ICommunities> {
        await AminoClient.login(this.username, this.password, this.deviceID);
        const communities = await AminoClient.getJoinedCommunities(0, 5 /* ToDo: Find a way to get all communities */);

        const resp: ICommunities = {
            communityList: [],
            on: (communityPattern: string | RegExp, listener: (community: Community, err: Error | null) => void) => {
                const targetComm = communities.communityList.find((element) => {
                    if (communityPattern instanceof RegExp) {
                        if (element.endpoint.match(communityPattern)) return true;
                        if (element.name.match(communityPattern)) return true;
                    } else {
                        if (element.endpoint === communityPattern) return true;
                        if (element.name === communityPattern) return true;
                    }
                    return false;
                });

                if (targetComm === undefined) {
                    listener({} as Community, new Error(`Community not found. '${communityPattern}' can't be matched with any joined community.`));
                } else {
                    const community = new Community(targetComm.ndcId, listener.bind(this));
                    this.listenCommunities.push(community);
                }
            }
        };

        for (const comm of communities.communityList) {
            resp.communityList.push({
                endpoint: comm.endpoint,
                name: comm.name,
                ndcId: comm.ndcId
            });
        }
        return resp;
    }
}