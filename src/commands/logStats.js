import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import os from "node:os";
import {Worker} from "worker_threads";

export const logStats = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: {type: 'string'},
        output: {type: 'string'},
    });
    if (!args.input || !args.output) {
        throw new ValidationError('Invalid input');
    }

    const cpus = os.cpus().length;
    const data = await fs.promises.readFile(path.resolve(state.directory, args.input), 'utf8');
    const lines = data.split("\n");
    const chunkSize = Math.floor(lines.length / cpus);

    const chunks = [];
    for (let i = 0; i < cpus; i++) {
        chunks.push(lines.slice(i * chunkSize, (i + 1) * chunkSize));
    }

    const workers = chunks.map(chunk => {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.resolve(import.meta.dirname, '../workers/logWorker.js'));

            worker.on('message', resolve);
            worker.on('error', reject);

            worker.postMessage(chunk);
        });
    });

    const workersResults = await Promise.all(workers);
    const results = workersResults.reduce((acc, result) => {
        acc.total += result.total;
        acc.totalResponseTimeMs += result.totalResponseTimeMs;
        Object.keys(result.levels).forEach((key) => {
            acc.levels[key] = (acc.levels[key] ?? 0) + result.levels[key];
        });
        Object.keys(result.status).forEach((key) => {
            acc.status[key] = (acc.status[key] ?? 0) + result.status[key];
        });
        Object.keys(result.paths).forEach((key) => {
            acc.paths[key] = (acc.paths[key] ?? 0) + result.paths[key];
        });

        return acc;
    }, {
        total: 0,
        levels: {},
        status: {},
        paths: {},
        totalResponseTimeMs: 0
    });
    results.topPaths = Object.keys(results.paths).map((key) => ({path: key, count: results.paths[key]})).sort((a, b) => b.count - a.count);
    delete results.paths;
    results.avgResponseTimeMs = results.totalResponseTimeMs / results.total;
    delete results.totalResponseTimeMs;

    const writer = fs.createWriteStream(path.resolve(state.directory, args.output));
    writer.end(JSON.stringify(results, null, 2));
}
