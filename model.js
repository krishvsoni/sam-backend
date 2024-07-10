import { Schema } from "mongoose";
import mongoose from "mongoose";
const processSchema = new Schema({
    processOwner: String,
    processId: String,
    processName: String,
    processType: String,
    messagesWithTags: [{
        messageId: String,
        tags: [String],
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});
const process=mongoose.model("Process",processSchema)
export default process