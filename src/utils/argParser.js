import { parseArgs } from 'node:util';

const split = (str) => {
    const args = [];
    let current = '';
    let quote = null;
    let escape = false;

    for (let i = 0; i < str.length; i++) {
        const ch = str[i];

        if (escape) {
            current += ch;
            escape = false;
            continue;
        }

        if (ch === '\\') {
            escape = true;
            continue;
        }

        if (quote) {
            if (ch === quote) {
                quote = null;
            } else {
                current += ch;
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            quote = ch;
            continue;
        }

        if (/\s/.test(ch)) {
            if (current.length) {
                args.push(current);
                current = '';
            }
            continue;
        }

        current += ch;
    }

    if (current.length) {
        args.push(current);
    }
    return args;
}

// const args = '--name "John Doe" --path "/tmp/my file.txt" --flag';

export const parse = (args, options) => {
    const argv = split(args);
    const { values } = parseArgs({
        args: argv,
        options,
        allowPositionals: true,
    });
    return values
}
