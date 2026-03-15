import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import {pipeline, Transform} from "stream";
import crypto from 'node:crypto';

export const decrypt = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: { type: 'string' },
        output: { type: 'string' },
        password: { type: 'string' },
    });
    if (!args.input || !args.output || !args.password) {
        throw new ValidationError('Invalid input');
    }

    const reader = fs.createReadStream(path.resolve(state.directory, args.input));

    let headerBuffer = null;
    let decryptBuffer = null;
    let decipher = null;
    let isHeaderParse = false;

    const transformer = new Transform({
        transform(chunk, encoding, callback) {
            if (!isHeaderParse) {
                headerBuffer = headerBuffer ? Buffer.concat([headerBuffer, chunk]) : chunk;
                if (headerBuffer.length < 28) {
                    return callback();
                }

                const salt = headerBuffer.subarray(0, 16);
                const iv = headerBuffer.subarray(16, 28);
                const key = crypto.pbkdf2Sync(args.password, salt, 100000, 32, 'sha256');
                decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

                isHeaderParse = true;
                chunk = headerBuffer.subarray(28);
                headerBuffer = null
            }
            const data = decryptBuffer ? Buffer.concat([decryptBuffer, chunk]) : chunk;
            if (data.length <= 16) {
                decryptBuffer = data;
                return callback();
            }

            const ciphertext = data.subarray(0, data.length - 16);
            decryptBuffer = data.subarray(data.length - 16);

            const decrypted = decipher.update(ciphertext);
            this.push(decrypted);

            callback();
        },
        flush (callback) {
            decipher.setAuthTag(decryptBuffer);

            const final = decipher.final();
            this.push(final);

            callback();
        }
    })

    const writer = fs.createWriteStream(path.resolve(state.directory, args.output));

    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);

        pipeline(
            reader,
            transformer,
            writer,
            Function.prototype,
        );
    });
}
