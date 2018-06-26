import AminoBot from "./src";

const bot = new AminoBot(process.env.AMINO_EMAIL as string, process.env.AMINO_PWD as string, process.env.AMINO_DEVICEID as string);

(async () => {
    // await bot.init();
    try {
        const communities = await bot.onLogin();

        for (const comm of communities.communityList) {
            communities.on(comm.endpoint, (community) => {
                console.log(community);
            })
        }
    } catch (err) {
        console.log("Error! Lets think about this later...");
        console.error(err);
    }
})();