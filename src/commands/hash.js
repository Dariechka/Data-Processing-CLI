import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const hash = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: {
            type: 'string',
        },
        algorithm: {
            type: 'string',
            default: 'sha256',
        },
        save: {
            type: 'boolean',
        },
    });
    if (!args.input) {
        throw new ValidationError('Invalid input');
    }

    const algorithm = crypto.createHash(args.algorithm);
    const reader = fs.createReadStream(path.resolve(state.directory, args.input));
    for await (const chunk of reader) {
        algorithm.update(chunk);
    }

    const result = algorithm.digest("hex")

    if (args.save) {
        const writer = fs.createWriteStream(path.resolve(state.directory, `${args.input}.${args.algorithm}`));
        writer.end(result);
    } else {
        console.log(`${args.algorithm}: ${result}`)
    }
}
