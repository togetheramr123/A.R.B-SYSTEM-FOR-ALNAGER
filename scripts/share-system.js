const localtunnel = require('localtunnel');

(async () => {
    const tunnel = await localtunnel({ port: 3000 });

    console.log('Successfully shared! Send this URL to your team:');
    console.log(tunnel.url);
    console.log('\nPress Ctrl+C to stop sharing.');

    tunnel.on('close', () => {
        // tunnels are closed
    });
})();
