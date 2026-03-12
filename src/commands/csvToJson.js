import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import {pipeline, Transform} from "stream";

export const csvToJson = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: { type: 'string' },
        output: { type: 'string' },
    });
    if (!args.input || !args.output) {
        throw new ValidationError('Invalid input');
    }
    const reader = fs.createReadStream(path.resolve(state.directory, args.input));

    let headers = null;
    let leftover = '';
    let isFirst = true;

    const transformer = new Transform({
        transform(chunk, encoding, callback) {

            const text = leftover + chunk.toString()
            const textArray = text.split(/\r?\n/);
            leftover = textArray.pop();

            let output = '';

            for (let line of textArray) {
                if (!line.trim()) continue;

                if (!headers) {
                    headers = line.split(',').map(header => header.trim());
                    output += '[';
                    continue;
                }

                const values = line.split(',');
                const data = {};

                headers.forEach((header, index) => {
                    data[header] = values[index];
                })

                if (!isFirst) {
                    output += ',\n'
                }
                isFirst = false;
                output += JSON.stringify(data)
            }

            callback(null, output);
        },
            flush(callback) {
                let output = '';

                if (leftover && headers) {
                    const values = leftover.split(',');
                    const data = {};

                    headers.forEach((header, index) => {
                        data[header] = values[index];
                    })

                    if (!isFirst) {
                        output += ',\n';
                    }
                    output += JSON.stringify(data);
                }

                output += ']';

                callback(null, output);
            }
    });

    await pipeline(
        reader,
        transformer,
        fs.createWriteStream(path.resolve(state.directory, args.output)),
        Function.prototype,
    );
}
