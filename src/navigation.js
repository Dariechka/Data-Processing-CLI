import fs from "fs/promises";
import path from "path";
import {ValidationError} from "./main.js";

export const up = async (state) => state.directory = path.resolve(state.directory, '..');

export const cd = async (state, p) => {
    if (!p) {
        throw new ValidationError('path required');
    }
    state.directory = path.resolve(state.directory, p);
};

export const ls = async (state) => {
    const entries = await fs.readdir(state.directory, { withFileTypes: true });
    const directories = entries
        .filter((file) => file.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));
    const files = entries
        .filter((file) => !file.isDirectory())
        .sort((a, b) => a.name.localeCompare(b.name));
    console.log('| Index | Name                         | Type      |');
    console.log('|-------|------------------------------|-----------|');
    const format = (str, length) => {
        const trimmed = str.toString().slice(0, length + 3);
        return (trimmed.length < str.length ? trimmed.slice(0, length) + '...' : trimmed).padEnd(length + 3);
    };
    for (const [index, entry] of [...directories, ...files].entries()) {
        console.log(`| ${format(index, 2)} | ${format(entry.name, 25)} | ${format(entry.isDirectory() ? 'directory' : 'file', 6)} |`);
    }
};
