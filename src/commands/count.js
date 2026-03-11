import path from "path";
import {ValidationError} from "../main.js";
import fs from "fs";
import {parse} from "../utils/argParser.js";

export const count = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: { type: 'string' },
    });
    if (!args.input) {
        throw new ValidationError('Invalid input');
    }
    const reader = fs.createReadStream(path.resolve(state.directory, args.input));

    const result = {
        lines: 0,
        words: 0,
        characters: 0
    }

    let leftover = '';

    await new Promise((resolve, reject) => {
        reader.on("data", chunk => {
            result.characters += chunk.length;

            const text = leftover + chunk;
            const textArray = text.split('\n');
            leftover = textArray.pop();

            result.lines += textArray.length;

            for (const line of textArray) {
                const words = line.trim().split(/\s+/).filter(Boolean);
                result.words += words.length;
            }
        })

        reader.on("end", () => {
            if (leftover) {
                result.Lines += 1;
                const words = leftover.trim().split(/\s+/).filter(Boolean);
                result.Words += words.length;
            }

            console.log(`Lines: ${result.lines}\nWords: ${result.words}\nCharacters: ${result.characters}`);
            resolve();
        });

        reader.on('error', () => {
            console.error('Operation failed');
            reject();
        });
    });
}
