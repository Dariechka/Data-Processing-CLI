import * as readline from "node:readline";
import {cd, ls, up} from "./navigation.js";
import {ValidationError} from "./main.js";
import {count} from "./commands/count.js";

const commands = {
    'up': up,
    'cd': cd,
    'ls': ls,
    'count': count,
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
        const index = line.search(/\s/);
        const command = line.substring(0, index);
        const argsStr = line.substring(index + 1);

        if (commands[command]) {
            try {
                await commands[command](state, argsStr);
            } catch (e) {
                if (e instanceof ValidationError) {
                    console.error('Invalid input');
                } else {
                    console.error('Operation failed');
                }
                rl.prompt();
                continue;
            }
            pwd();
            rl.prompt();
        } else if (command === 'exit') {
            break;
        } else {
            console.error('Invalid input');
            rl.prompt();
        }
    }
}
