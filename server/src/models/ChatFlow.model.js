// const mongoose = require('mongoose');

// // Node types: start, message, condition, aiReply, humanHandoff, end
// const NodeSchema = new mongoose.Schema({
//     id: { type: String, required: true },
//     type: { type: String, enum: ['start', 'message', 'condition', 'aiReply', 'humanHandoff', 'end'], required: true },
//     label: { type: String },
//     data: { type: mongoose.Schema.Types.Mixed },  // node specific config
//     position: {
//         x: { type: Number, default: 0 },
//         y: { type: Number, default: 0 },
//     },
// }, { _id: false });

// // Edge — nodes এর মধ্যে connection
// const EdgeSchema = new mongoose.Schema({
//     id: { type: String, required: true },
//     source: { type: String, required: true },  // source node id
//     target: { type: String, required: true },  // target node id
//     label: { type: String },                  // condition label (e.g. "Yes", "No")
//     data: { type: mongoose.Schema.Types.Mixed },
// }, { _id: false });

// const ChatFlowSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     name: { type: String, required: true },
//     description: { type: String },

//     // Flow active কিনা — active থাকলে AI chat এ apply হবে
//     active: { type: Boolean, default: false },

//     // Platform — chat, whatsapp, messenger, instagram, all
//     platform: {
//         type: String,
//         enum: ['all', 'chat', 'whatsapp', 'messenger', 'instagram'],
//         default: 'all',
//     },

//     // ReactFlow nodes and edges
//     nodes: { type: [NodeSchema], default: [] },
//     edges: { type: [EdgeSchema], default: [] },

//     // Trigger keywords — এই keywords দেখলে flow activate হবে
//     triggers: { type: [String], default: [] },

//     // Stats
//     stats: {
//         triggered: { type: Number, default: 0 },
//         completed: { type: Number, default: 0 },
//     },

//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date, default: Date.now },
// });

// ChatFlowSchema.pre('save', function (next) {
//     this.updatedAt = new Date();
//     next();
// });

// ChatFlowSchema.index({ userId: 1 });
// ChatFlowSchema.index({ userId: 1, active: 1 });

// module.exports = mongoose.model('ChatFlow', ChatFlowSchema);


const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    type: { type: String, enum: ['start', 'message', 'condition', 'aiReply', 'humanHandoff', 'end'], required: true },
    label: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    position: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
    },
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const ChatFlowSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    active: { type: Boolean, default: false },
    platform: {
        type: String,
        enum: ['all', 'chat', 'whatsapp', 'messenger', 'instagram'],
        default: 'all',
    },
    nodes: { type: [NodeSchema], default: [] },
    edges: { type: [EdgeSchema], default: [] },
    triggers: { type: [String], default: [] },
    stats: {
        triggered: { type: Number, default: 0 },
        completed: { type: Number, default: 0 },
    },
}, {
    timestamps: true,
});

ChatFlowSchema.index({ userId: 1 });
ChatFlowSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model('ChatFlow', ChatFlowSchema);