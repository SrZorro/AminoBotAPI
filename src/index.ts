import AminoClient from "aminoclient";
import * as AminoTypes from "aminoclient/dist/AminoTypes";

interface ICommunities {
    communityList: Array<{
        name: string;
        endpoint: string;
        ndcId: number;
    }>;
    on: (event: string | RegExp, listener: (community: Community) => void) => void;
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
            on: (communityPattern: string | RegExp, listener: (community: Community) => void) => {
                
                const community = new Community(communityPattern);
                this.listenCommunities.push(community);
                listener(community);
            }
        }

        for (const comm of communities.communityList) {
            resp.communityList.push({
                endpoint: comm.endpoint,
                name: comm.name,
                ndcId: comm.ndcId
            })
        }
        return resp;
    }
}

class Community {
    community: AminoTypes.IAminoCommunity | null = null;
    constructor(ndcId: number) {
        AminoClient.getCommunityInfo(ndcId);
    }
    on(event: string | RegExp) {

    }
}