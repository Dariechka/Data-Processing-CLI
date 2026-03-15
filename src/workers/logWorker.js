import { parentPort } from 'worker_threads';

parentPort.on('message', (lines) => {
    const result = {
        total: 0,
        levels: {},
        status: {},
        paths: {},
        totalResponseTimeMs: 0
    };

    for (const line of lines) {
        const [
            timestamp,
            level,
            service,
            statusCode,
            responseTime,
            method,
            path,
        ] = line.split(' ');

        result.total++;

        result.levels[level] = (result.levels[level] ?? 0) + 1;

        const statusClass = `${statusCode[0]}xx`;
        result.status[statusClass] = (result.status[statusClass] ?? 0) + 1;
        result.paths[path] = (result.paths[path] ?? 0) + 1;
        result.totalResponseTimeMs += Number(responseTime);
    }
    parentPort.postMessage(result);
});
