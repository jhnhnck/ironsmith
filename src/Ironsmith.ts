/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import * as debug from 'debug'
import * as fs from 'fs-extra'
import { clone, merge } from 'lodash'
import * as path from 'path'
import * as recursive from 'recursive-readdir'

import { IronsmithFile } from './File'

const log = debug('ironsmith')

/* --- Ironsmith --- */

export class Ironsmith {
  private plugins: Ironsmith.Plugin[] = []
  private files: Ironsmith.FileMap

  private _rootPath: string = __dirname + '/../../'
  private _sourcePath: string = 'src'
  private _buildPath: string = 'build'
  private _assetsPath: string = 'assets'
  private _loadAssets: boolean = true

  public metadata: Ironsmith.Metadata = {}
  public clean: boolean = true

  /* Initialize a new `Ironsmith` builder */
  constructor(options?: Ironsmith.Options) {
    options = options || {}
    Object.assign(this, options)
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

  get sourcePath(): string { return this._sourcePath }

  set sourcePath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._sourcePath = path.resolve(this._rootPath, directory)
      log(`setSourcePath(...): ${this._sourcePath}`)
    } else {
      console.warn('Warning! Blatantly refusing to make the source path blank.')
    }
  }

  /* --- Assets Directory --- */

  get assetsPath(): string { return this._loadAssets ? this._assetsPath : undefined }

  set assetsPath(directory: string) {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._assetsPath = path.resolve(this._rootPath, directory)
      log(`setAssetsPath(...): ${this._assetsPath}`)
    } else {
      this._loadAssets = false
    }
  }

  /* --- Process Metadata --- */

  public mergeMetadata(metadata: Ironsmith.Metadata) { merge(this.metadata, metadata) }

  /* --- Other Properties --- */

  set verbose(value: boolean) {
    IronsmithFile.verbose = value
    log.enabled = value
  }

  /* --- Build Process --- */

  /* Add a 'Ironsmith.Plugin' function to the stack */
  public use(plugin: Ironsmith.Plugin): Ironsmith {
    log(`use(...): Registered plugin "${plugin.name}"`)
    this.plugins.push(plugin)
    return this
  }

  /* Build with the current settings to the destination directory. */
  public async build(): Promise<Ironsmith.FileMap> {
    try {
      if (this.clean) {
        log(`build(): Cleaning build directory`)
        await fs.remove(path.join(this._buildPath, '*'))
      }

      await this.process()
      await Ironsmith.dumpDirectory(this.files, this._buildPath)
      return this.files

    } catch (err) {
      return Promise.reject(err)
    }
  }

  /* Process files through plugins without writing the output files. */
  public async process(): Promise<Ironsmith.FileMap> {
    try {
      const sources = await Ironsmith.loadDirectory(this._sourcePath)

      if (this._loadAssets) {
        const assets = await Ironsmith.loadDirectory(this._assetsPath, {asset: true})
        this.files = new Map([...sources, ...assets])
      } else {
        this.files = sources
      }

      for (const plugin of this.plugins) {
        log(`process(): Running plugin ${plugin.name}`)
        await new Promise((next) => { plugin(this.files, this, next) })
      }
      return this.files

    } catch (err) {
      return Promise.reject(err)
    }
  }

  /* --- Static FileMap Functions --- */

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
  public static async dumpDirectory(files: Ironsmith.FileMap, directory: string): Promise<void> {
    log(`dumpDirectory(...): Dumping ${files.size} files into ${directory}`)

    files.forEach(async (file, name) => {
      const absPath = path.resolve(directory, name)

      await fs.mkdirs(path.dirname(absPath))
      log(`Writing file: ./${name}${file.asset ? ' (asset)' : '' }`)
      await fs.writeFile(absPath, file.contents)
    })
  }
}
