import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

export const hashCompare = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: {
            type: 'string',
        },
        hash: {
            type: 'string',
        },
        algorithm: {
            type: 'string',
            default: 'sha256',
        },
    });
    if (!args.input || !args.hash) {
        throw new ValidationError('Invalid input');
    }

    const algorithm = crypto.createHash(args.algorithm);

    const calculatedReader = fs.createReadStream(path.resolve(state.directory, args.input));
    for await (const chunk of calculatedReader) {
        algorithm.update(chunk);
    }
    const calculatedHash = algorithm.digest("hex");

    const expectedReader = fs.createReadStream(path.resolve(state.directory, args.hash));
    let expectedHash = '';
    for await (const chunk of expectedReader) {
        expectedHash += chunk.toString();
    }

    if (calculatedHash === expectedHash) {
        console.log(`OK`);
    } else {
        console.log(`MISMATCH`);
    }

}
