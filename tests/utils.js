import fs from 'fs'

export function withTempFile() {
  const filenames = []
  const tmpDir = fs.mkdtempSync('test')
  for (let i = 0; i < arguments.length - 1; i++) {
    const filename = tmpDir + '/' + i
    filenames.push(filename)
    fs.writeFileSync(filename, arguments[i], { encoding: 'UTF-8' })
  }
  const func = arguments[arguments.length - 1]

  try {
    func(...filenames)
  } finally {
    for (const filename of filenames) {
      fs.unlinkSync(filename)
    }
    fs.rmdirSync(tmpDir)
  }
}
