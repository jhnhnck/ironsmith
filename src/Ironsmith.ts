/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import * as debug from 'debug'
import * as fs from 'fs-extra'
import * as recursive from 'recursive-readdir'
import * as path from 'upath'

import { IronsmithFile } from './File'

const log = debug('ironsmith')

/* --- Ironsmith --- */

export class Ironsmith {
  private plugins: Ironsmith.Plugin[] = []
  private files: Ironsmith.FileMap

  private _rootPath: string = __dirname + '/../../'  // I think this only works for me
  private _sourcePath: string = 'src'
  private _buildPath: string = 'build'
  private _assetsPath: string = 'assets'

  public metadata: Ironsmith.Metadata = {}
  public loadSource: boolean = false
  public loadAssets: boolean = false
  public clean: boolean = false

  /* Initialize a new `Ironsmith` builder */
  constructor(options?: Ironsmith.Options) {
    options = options || {}
    Object.assign(this, options)

    this.files = new Map<string, IronsmithFile>()
  }

  /* --- Working Directory --- */

  get rootPath(): string { return this._rootPath }

  set rootPath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._rootPath = path.resolve(directory)
      log(`setRoot(...): ${this._rootPath}`)
    } else {
      console.warn('Warning! Blatantly refusing to make the root path blank.')
    }
  }

  /* --- Output Directory --- */

  get buildPath(): string { return this._buildPath }

  set buildPath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._buildPath = path.resolve(this._rootPath, directory)
      log(`setBuildPath(...): ${this._buildPath}`)
    } else {
      console.warn('Warning! Blatantly refusing to make the build path blank.')
    }
  }

  /* --- Source Directory --- */

  get sourcePath(): string { return this.loadSource ? this._sourcePath : undefined }

  set sourcePath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._sourcePath = path.resolve(this._rootPath, directory)
      log(`setSourcePath(...): ${this._sourcePath}`)
    } else {
      console.warn('Warning! Blatantly refusing to make the source path blank.')
    }
  }

  /* --- Assets Directory --- */

  get assetsPath(): string { return this.loadAssets ? this._assetsPath : undefined }

  set assetsPath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._assetsPath = path.resolve(this._rootPath, directory)
      log(`setAssetsPath(...): ${this._assetsPath}`)
    } else {
      this.loadAssets = false
    }
  }

  /* --- Other Properties --- */

  set verbose(value: boolean) {
    IronsmithFile.verbose = value
    log.enabled = value
  }

  /* --- Build Initialization --- */

  /* Add a 'Ironsmith.Plugin' function to the stack */
  public use(plugin: Ironsmith.Plugin): Ironsmith {
    log(`use(...): Registered plugin "${plugin.name}"`)
    this.plugins.push(plugin)
    return this
  }

  /* Add a file to the Ironsmith instance before building/processing */
  public addFile(path: string, file: IronsmithFile) {
    this.files.set(path, file)
  }

  /* --- Build Process --- */

  /* Build with the current settings to the destination directory. */
  public async build(): Promise<Ironsmith.FileMap> {
    try {
      if (this.clean) {
        log(`build(): Cleaning build directory`)
        await fs.emptyDir(this._buildPath)
      }

      await this.process()
      await Ironsmith.dumpDirectory(this._buildPath, this.files)
      return this.files

    } catch (err) {
      return Promise.reject(err)
    }
  }

  /* Process files through plugins without writing the output files. */
  public async process(): Promise<Ironsmith.FileMap> {
    try {
      let sources: Ironsmith.FileMap, assets: Ironsmith.FileMap

      if (this.loadSource) {
        sources = await Ironsmith.loadDirectory(this._sourcePath)
      }

      if (this.loadAssets) {
        assets = await Ironsmith.loadDirectory(this._assetsPath, {asset: true})
      }

      this.files = new Map([...this.files, ...(sources || []), ...(assets || [])])

      for (const plugin of this.plugins) {
        log(`process(): Running plugin ${plugin.name}`)
        await new Promise((next) => { plugin(this.files, this, next) })
      }
      return this.files

    } catch (err) {
      return Promise.reject(err)
    }
  }

  /* --- File Functions --- */

  /* Loads all of the files contained within a directory into the file map as if it were loaded from the source directory */
  public async loadDirectory(directory: string, properties?: IronsmithFile.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap> {
    const files = await Ironsmith.loadDirectory(directory, properties)
    this.files = new Map([...this.files, ...files])

    return this.files
  }

  /* --- Static File Functions --- */

  /* Abstracts the reading of files so it can be used more abstractly */
  public static async loadDirectory(directory: string, properties?: IronsmithFile.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap> {
    const filenames = await recursive(path.resolve(directory))
    const files: Ironsmith.FileMap = new Map()
    let prefix: string = ''

    properties = properties || {}

    if (properties.loadRelative !== undefined) {
      prefix = properties.loadRelative

      if (prefix.startsWith('/')) { prefix = prefix.substring(1) }
      if (!prefix.endsWith('/') && prefix.length > 0) { prefix += '/' }

      delete properties.loadRelative
    }

    log(`loadDirectory(...): Loading ${filenames.length} files from ${directory} ${prefix.length > 0 ? ` into ${prefix}` : ''}`)

    for (const name of filenames) {
      const buffer = await fs.readFile(name)

      try {
        const file = await new IronsmithFile(buffer, `${prefix}${path.relative(directory, name)}`, Object.assign({}, properties))

        log(` - loaded: ${file.path}${file.asset ? ' (asset)' : ''}`)
        files.set(file.path, file)

      } catch (err) {  // This allows for Augments and/or constructors to reject the creation of files by throwing an error
        log(` - not loaded: ${name} (${err.message})`)
      }
    }

    return files
  }

  /* Writes a `Ironsmith.FileMap` into directory */
  public static async dumpDirectory(directory: string, files: Ironsmith.FileMap): Promise<void> {
    log(`dumpDirectory(...): Dumping ${files.size} files into ${directory}`)

    files.forEach(async (file, name) => {
      const absPath = path.resolve(directory, name)

      await fs.mkdirs(path.dirname(absPath))
      log(`Writing file: ./${name}${file.asset ? ' (asset)' : '' }`)
      await fs.writeFile(absPath, file.contents)
    })
  }
}
