import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = spawn('node', ['server/api.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: '3002' }
});

server.stdout.on('data', (data) => {
    console.log(`[SERVER]: ${data}`);
});

server.stderr.on('data', (data) => {
    console.error(`[SERVER ERR]: ${data}`);
});

console.log("Starting server...");

setTimeout(() => {
    console.log("Running test script...");
    const test = spawn('node', ['test_title_generation.js'], { cwd: __dirname });

    test.stdout.on('data', (data) => {
        console.log(`[TEST]: ${data}`);
    });

    test.stderr.on('data', (data) => {
        console.error(`[TEST ERR]: ${data}`);
    });

    test.on('close', (code) => {
        console.log(`Test exited with code ${code}`);
        server.kill();
        process.exit(code);
    });
}, 3000);
