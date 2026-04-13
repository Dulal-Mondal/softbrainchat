// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//     userId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//         index: true
//     },
//     type: {
//         type: String,
//         enum: ['ai_no_answer', 'review_needed', 'system', 'billing'],
//         required: true
//     },
//     message: {
//         type: String,
//         required: true
//     },
//     data: {
//         type: mongoose.Schema.Types.Mixed,
//         default: {}
//     },
//     read: {
//         type: Boolean,
//         default: false
//     }
// }, {
//     timestamps: true  // createdAt, updatedAt auto
// });

// module.exports = mongoose.model('Notification', notificationSchema);


const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        // ✅ index: true সরানো — নিচে schema.index() দিয়ে করবো
    },
    type: {
        type: String,
        enum: ['ai_no_answer', 'review_needed', 'system', 'billing'],
        required: true,
    },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
}, {
    timestamps: true,
});

NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ userId: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);