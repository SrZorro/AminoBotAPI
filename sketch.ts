import AminoBot from "./src";

const bot = new AminoBot("**REDACTED**", "**REDACTED**", "**REDACTED**");
bot.on("login", (comms) => {
    console.log(comms);

    console.log(comms.names);

    // Listen to communities where his name contains /regex/
    comms.on(/programming/, (community) => {
        // ToDo...
    });

    // Listen to all other communities
    for (const communityName of comms.names) {
        if (!communityName.includes("programming"))
            comms.on(communityName, (community) => {
                // Listen all communities that don't contain "programming"
                // ToDo...
            });
    }
});

bot.on("loginFailed", (err) => {
    console.error(err);
});

(async () => {
    await bot.init();
})();