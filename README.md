# Amino Bot API wrapper for [AminoClient](https://github.com/SrZorro/AminoClient)

Its still really inmature this library, but can be used for basic usage to interact with threads, check the example to see what can do. 

It should work with VanillaJS, but its best used with TypeScript to get the full potential.

The package is not yet pushed to the NPM registry, when I feel that its ready to be kinda usable I will push it. If you want to use it clone this repo.

### TypeScript example
```typescript
// import AminoBot from "aminobotapi"; /* Not yet published to NPM */
import AminoBot from "./src";

const bot = new AminoBot(process.env.AMINO_EMAIL as string, process.env.AMINO_PWD as string, process.env.AMINO_DEVICEID as string);

(async () => {
    try {
        const communities = await bot.onLogin();

        console.log(`Joined communities ${communities.communityList.length}.`);
        for (const comm of communities.communityList) {
            console.log(`Community name: ${comm.name}.`);
        }

        if (communities.communityList.length > 0)
            // Pass string or RegExp, will be matched or compared with the joined communities endpoint or name
            // In this example we listen to the first community of the list
            communities.on(communities.communityList[0].endpoint, (comm, commErr) => {
                // If error, bubble it to the try catch or handle it here,
                // will raise an error if the string or regex didn't match any joined community
                if (commErr) return console.error(commErr);

                // comm.info contains the returned value from Amino API
                console.log(`Listening community ${comm.info.name}.`);

                if (comm.threads.joinedThreads.length > 0)
                    if (comm.threads.joinedThreads[0].title !== undefined) // title could be undefined, for example if private chat
                        // We listen to the first community (if it contains title)
                        comm.threads.joined(comm.threads.joinedThreads[0].title, (thread, threadErr) => {
                            // If error, bubble it to the try catch or handle it here,
                            // will raise an error if the string or regex didn't match any joined thread title
                            if (threadErr) return console.error(threadErr);

                            // comm.info contains the returned value from Amino API
                            console.log(`Thread ${thread.info.title} count ${thread.info.membersCount}`);

                            // Listen to ALL messages
                            thread.onMessage("*", (msg) => {
                                console.log("Message: " + msg.content);
                            });

                            // A regex or string can be passed to listen for specific messages
                            thread.onMessage(/^@bot$/, (msg) => {
                                // msg contains returned value from that message, also added the .send method
                                msg.send(`Hello ${msg.author.nickname}!`);
                            });

                            // .sendMessage can be used to send a message without the need to react to an incomming one
                            thread.sendMessage(`This conversation is being monitored by a bot.`);
                        });
            });

    } catch (err) {
        // Safety guard for error bubbling
        console.error(err);
    }
})();
```