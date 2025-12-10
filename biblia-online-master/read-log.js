import fs from 'fs';
import path from 'path';

const logPath = path.join(process.cwd(), 'server-debug.log');

if (fs.existsSync(logPath)) {
    const stats = fs.statSync(logPath);
    const fileSize = stats.size;
    const bufferSize = Math.min(5000, fileSize);
    const buffer = Buffer.alloc(bufferSize);

    const fd = fs.openSync(logPath, 'r');
    fs.readSync(fd, buffer, 0, bufferSize, fileSize - bufferSize);
    fs.closeSync(fd);

    console.log(buffer.toString('utf-8'));
} else {
    console.log('Log file not found');
}
