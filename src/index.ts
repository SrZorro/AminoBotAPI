import { StrictEventEmitter } from "./EventListener";
import AminoClient from "aminoclient";

interface ICommunities {
    communityList: Array<{
        endpoint: string;
        name: string;
        ndcId: number;
    }>;
}

interface IAminoBotEvents {
    login: void;
    loginFailed: void;
}

export default class AminoBot extends StrictEventEmitter<IAminoBotEvents> {
    private username: string;
    private password: string;
    private deviceID: string;
    constructor(username: string, password: string, deviceID: string) {
        super();
        this.username = username;
        this.password = password;
        this.deviceID = deviceID;
    }
    public async init() {
        try {
            const auth = await AminoClient.login(this.username, this.password, this.deviceID);
            const communityList = await AminoClient.getJoinedCommunities(0, 5 /* ToDo: Find a way to get all communities */);
            this.emit("login", communityList);
        } catch (e) {
            this.emit("loginFailed", e);
        }
    }
}