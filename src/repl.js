import * as readline from "node:readline";
import {cd, ls, up} from "./navigation.js";
import {ValidationError} from "./main.js";
import {count} from "./commands/count.js";
import {csvToJson} from "./commands/csvToJson.js";
import {jsonToCsv} from "./commands/jsonToCsv.js";
import {encrypt} from "./commands/encrypt.js";

const commands = {
    'up': up,
    'cd': cd,
    'ls': ls,
    'count': count,
    'csv-to-json': csvToJson,
    'json-to-csv': jsonToCsv,
    'encrypt': encrypt,
};

export const repl = async (state) => {
    console.log("Welcome to Data Processing CLI!");

    const pwd = () => console.log(`You are currently in ${state.directory}`);
    pwd();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> ',
    });

    rl.prompt();

    for await (const line of rl) {
        let command
        let argsStr = ''
        if (!/\s/.test(line)) {
            command = line;
        } else {
            const index = line.search(/\s/);
            command = line.substring(0, index);
            argsStr = line.substring(index + 1)
        }

        if (commands[command]) {
            try {
                await commands[command](state, argsStr);
            } catch (e) {
                if (e instanceof ValidationError) {
                    console.error('Invalid input');
                } else {
                    console.error(e);
                    console.error('Operation failed');
                }
                rl.prompt();
                continue;
            }
            pwd();
            rl.prompt();
        } else if (command === '.exit') {
            break;
        } else {
            console.error('Invalid input');
            rl.prompt();
        }
    }
}
