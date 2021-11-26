import fs from 'fs';

export function mkdirIfNotExists(dir) {
    try {
        fs.mkdirSync(dir);
    } catch (e) {
        if (e.code !== 'EEXIST') throw e;
    }
}