import express from 'express';

const app = express();
const PORT = 3001;

app.get('/test', (req, res) => {
    res.json({ message: 'Server is running!' });
});

const server = app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});

// Keep the process alive
setInterval(() => {
    console.log('Server still alive at', new Date().toISOString());
}, 5000);

// Prevent exit
process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
