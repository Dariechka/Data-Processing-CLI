import {parse} from "../utils/argParser.js";
import {ValidationError} from "../main.js";
import fs from "fs";
import path from "path";
import {pipeline, Transform} from "stream";
import crypto from 'node:crypto';

export const encrypt = async (state, argsStr) => {
    const args = parse(argsStr, {
        input: { type: 'string' },
        output: { type: 'string' },
        password: { type: 'string' },
    });
    if (!args.input || !args.output || !args.password) {
        throw new ValidationError('Invalid input');
    }

    const reader = fs.createReadStream(path.resolve(state.directory, args.input));
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.pbkdf2Sync(args.password, salt, 100000, 32, 'sha256');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let isHeader = false;

    const transformer = new Transform({
        transform(chunk, encoding, callback) {
            if (!isHeader) {
                this.push(Buffer.concat([salt, iv]));
                isHeader = true;
            }
            const encrypted = cipher.update(chunk);
            this.push(encrypted);

            callback();
        },
        flush(callback) {
            const final = cipher.final();
            const tag = cipher.getAuthTag();

            this.push(final);
            this.push(tag);

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
