import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import {pipeline, Transform} from "stream";

export const jsonToCsv = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: { type: 'string' },
        output: { type: 'string' },
    });
    if (!args.input || !args.output) {
        throw new ValidationError('Invalid input');
    }
    const reader = fs.createReadStream(path.resolve(state.directory, args.input));

    let buffer = '';
    let header = []

    const transformer = new Transform({
        transform(chunk, encoding, callback) {
            buffer += chunk.toString();
            callback()
        },
        flush(callback) {
            const array = JSON.parse(buffer);

            let output = '';

            array.forEach(row => {
                if (header.length === 0) {
                    output += Object.keys(row).join(',') + '\n';
                    header = Object.keys(row)
                }

                let csvRow = []
                header.forEach((key) => {
                    if (row[key]) {
                        csvRow.push(row[key]);
                    } else {
                        csvRow.push('')
                    }
                });
                output += csvRow.join(',') + '\n';
            })

            callback(null, output);
        }

    })

    await pipeline(
        reader,
        transformer,
        fs.createWriteStream(path.resolve(state.directory, args.output)),
        Function.prototype,
    );
}
