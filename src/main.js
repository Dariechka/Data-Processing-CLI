import os from "node:os";
import {repl} from "./repl.js";

export class ValidationError extends Error {
    constructor(message) {
        super(message);
    }
}

const state = {
    directory: os.homedir(),
};

const bye = () => console.log('\nThank you for using Data Processing CLI!');
process.on('exit', bye);
process.on('SIGINT', bye);

await repl(state);
process.exit(0);
