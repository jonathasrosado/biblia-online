import 'dotenv/config';
console.log("Loaded Keys:");
Object.keys(process.env).forEach(k => {
    if (k.includes('KEY') || k.includes('SECRET') || k.includes('TOKEN')) {
        console.log(`${k}: ${process.env[k] ? ((process.env[k].length > 5) ? 'EXISTS (' + process.env[k].substring(0, 5) + '...)' : 'SHORT') : 'UNDEFINED'}`);
    }
});
