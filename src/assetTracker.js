import fs from 'fs'
import childProcess from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { createHash } from 'crypto'
import { mkdirIfNotExists } from './utils.js'

export class AssetTracker {
  constructor(config) {
    this._assetToOutputFileMap = new Map()
    this._outputs = new Set()
    this._config = config
  }

  resolve(ref, srcPath, currentRef) {
    if (!ref) return

    let assetFile
    if (ref.startsWith('/')) {
      assetFile = this._config.dirs.assets + ref
    } else if (ref.startsWith('@')) {
      assetFile = this._config.dirs.template + '/node_modules/' + ref.substring(1)
    } else if (ref.startsWith('https://') || ref.startsWith('https://') || ref.indexOf('../') !== -1) {
      return null
    } else {
      const dir = path.dirname(srcPath)
      assetFile = dir + '/' + ref
    }

    let assetOutputFile = this._assetToOutputFileMap.get(assetFile)
    if (!assetOutputFile) {
      if (!fs.existsSync(assetFile)) {
        throw new Error(`Asset '${ref}' doesn't exist`)
      }
      assetOutputFile = this.add(assetFile)
    }
    if (currentRef) {
      return path.relative(path.basename(currentRef), assetOutputFile)
    } else {
      return '/' + assetOutputFile
    }
  }

  add(assetFile) {
    let outputFile = path.basename(assetFile)
    outputFile = this._config.dirs.assetsOutput + '/' + outputFile
    if (this._outputs.has(assetFile)) {
      const prefix = createHash('md5').update(assetFile).digest('hex').substring(0, 8)
      outputFile = prefix + outputFile
    }
    this._outputs.add(outputFile)
    this._assetToOutputFileMap.set(assetFile, outputFile)
    return outputFile
  }

  copyToOutput() {
    const copyFile = promisify(fs.copyFile)
    mkdirIfNotExists(this._config.dirs.outputBase + '/' + this._config.dirs.assetsOutput)
    return Promise.all([...this._assetToOutputFileMap.entries()]
      .map(([src, dest]) => copyFile(src, this._config.dirs.outputBase + '/' + dest)))
  }

  async mayRunNpmInstall() {
    const stat = promisify(fs.stat)
    const templateDir = this._config.dirs.template
    try {
      const packageJsonModifyDate = (await stat(templateDir + "/package.json")).mtimeMs;
      try {
        const nodeModulesModifyDate = (await stat(templateDir + "/node_modules")).mtimeMs;
        if (nodeModulesModifyDate >= packageJsonModifyDate) {
          return
        }
        const packageLockJsonModifyDate = (await stat(templateDir + "/package-lock.json")).mtimeMs;
        if (packageLockJsonModifyDate >= packageJsonModifyDate) {
          return
        }

      } catch (e) {
        // noop
      }

      const npmProcess = childProcess.spawn("npm install", {
        cwd: templateDir,
        shell: true
      });
      npmProcess.stdout.on('data', (data) => {
        console.log(`npm: ${data}`);
      });

      await new Promise((resolve) => npmProcess.on('close', resolve))
    } catch (e) {
      // noop
    }
  }
}
