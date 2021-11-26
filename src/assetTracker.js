import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import { createHash } from 'crypto'
import { mkdirIfNotExists } from './utils.js'

const assetsDir = "assets";
const assetsOutputDir = "assets";

export class AssetTracker {
    constructor() {
        this._assetToOutputFileMap = new Map();
        this._outputs = new Set();
    }

    resolve(ref, basePath) {
        if (!ref) return;

        let assetFile;
        if (ref.startsWith("/")) {
            assetFile = assetsDir + ref;
        } else if (ref.startsWith("https://") || ref.startsWith("https://") || ref.indexOf("../") !== -1) {
            return null;
        } else {
            const dir = path.dirname(basePath);
            assetFile = dir + "/" + ref;
        }

        let assetOutputFile = this._assetToOutputFileMap.get(assetFile);
        if (!assetOutputFile) {
            if (!fs.existsSync(assetFile)) {
                throw new Error(`Asset '${ref}' doesn't exist`);
            }
            assetOutputFile = this.add(assetFile);
        }
        return "/" + assetOutputFile;
    }

    add(assetFile) {
        let outputFile = path.basename(assetFile);
        outputFile = assetsOutputDir + "/" + outputFile;
        if (this._outputs.has(assetFile)) {
            const prefix = createHash("md5").update(assetFile).digest("hex").substring(0, 8);
            outputFile = outputBaseDir + "/" + prefix + outputFile;
        }
        this._outputs.add(outputFile);
        this._assetToOutputFileMap.set(assetFile, outputFile);
        return outputFile;
    }

    copyToOutput(outputBaseDir) {
        const copyFile = promisify(fs.copyFile);
        mkdirIfNotExists(outputBaseDir + "/" + assetsOutputDir);
        return Promise.all([...this._assetToOutputFileMap.entries()]
            .map(([src, dest]) => copyFile(src, outputBaseDir + "/" + dest)));
    }

}