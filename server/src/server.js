// const app = require('./app');

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//     console.log(`\n🚀 SoftBrainChat Server running on port ${PORT}`);
//     console.log(`   Mode   : ${process.env.NODE_ENV || 'development'}`);
//     console.log(`   Client : ${process.env.CLIENT_URL}\n`);
// });







require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initSocket } = require('./config/socket');

const PORT = process.env.PORT || 5000;

// HTTP server তৈরি করো (Express app wrap করে)
const server = http.createServer(app);

// Socket.IO attach করো
initSocket(server);

server.listen(PORT, () => {
    console.log(`\n🚀 SoftBrainChat server running on port ${PORT}`);
    console.log(`📡 WebSocket ready for real-time updates`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});