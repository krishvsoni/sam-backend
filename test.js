// const { createDataItemSigner, spawn, message, result } = require('@permaweb/aoconnect');
import { createDataItemSigner, spawn, message, result } from '@permaweb/aoconnect';
import fs from 'fs';
const wallet = JSON.parse(fs.readFileSync('./wallet.json', 'utf8'));

async function getProcessId() {
    const processId = await spawn({
        module: "nI_jcZgPd0rcsnjaHtaaJPpMCW847ou-3RGA5_W3aZg",
        scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
        signer: createDataItemSigner(wallet),
        tags: [{ name: "type", value: "process" }],
        data: 'require("json").encode(inbox)',
    });
    return processId;
}
async function displayID() {

    const processId = await getProcessId();
    console.log(processId);
}
displayID()
// async function spawncron() {
//     const cronId = await spawn({
//         module: "nI_jcZgPd0rcsnjaHtaaJPpMCW847ou-3RGA5_W3aZg",
//         scheduler: "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA",
//         signer: createDataItemSigner(wallet),
//         tags: [{ name: "" }]
//     })
// }
// async function sendMessageForCron(processId) {
//     const msgCron = await message({
//         process: processId,
//         tags: [{ name: "Action", value: "Eval" }],
//         signer: createDataItemSigner(wallet),
//         data: `Handlers.add(
//     "getUserData",
//     Handlers.utils.hasMatchingTag("Action","GetUserData"),
//     function(msg)
//         return require("json").encode(Inbox)
        
//     end
//     )`
//     })
//     const res = await result({ process:processId, message:msgCron });
    
//     return res;
// }
const getresult=await sendMessageForCron("s8qrKZgLEX2q5_0Ytn29WX3aLHZUuWGwYRCNmA40Ryo");
console.log(getresult);