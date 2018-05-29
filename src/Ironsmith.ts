/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import * as debug from 'debug'
import * as fs from 'fs-extra'
import { clone, merge } from 'lodash'
import * as path from 'path'
import * as recursive from 'recursive-readdir'

import { File } from './File'

const log = debug('ironsmith')

/* --- Type Declaration Again --- */

export declare namespace Ironsmith {
  type FileMap = Map<string, Ironsmith.File>
  type Next = () => void
  type Plugin = (files: Ironsmith.FileMap, fe: Ironsmith, next: Ironsmith.Next) => void
  interface Metadata { [index: string]: any }

  interface Options {
    rootPath?: string
    sourcePath?: string
    buildPath?: string
    assetsPath?: string
    clean?: boolean
    loadAssets?: boolean
    metadata?: Metadata
    verbose?: boolean
  }

  interface LoadOptions {
    loadRelative?: string
  }

  namespace File {
    type Augment = (file: File) => any
    type Tags = Set<string>

    interface Options {
      tags?: string[] | File.Tags
      asset?: boolean
      [index: string]: any
    }
  }

  interface File {
    asset: boolean
    contents: Buffer | string | any
    path: string
    readonly tagCount: number
    [index: string]: any
  }

  class File {
    private static _augments
    private _tags

    constructor(contents: Buffer | string | any, path: string, properties?: File.Options)
    public static verbose: boolean

    /* --- File Augments --- */

    public static addAugment(ftn: File.Augment): void
    private initialize(): void

    /* --- Tagging Set Abstraction --- */

    public tag(value: string): void
    public untag(value: string): boolean
    public tags(): IterableIterator<string>
    public tagged(value: string): boolean
  }
}

/* --- Ironsmith --- */

export class Ironsmith {
  private plugins: Ironsmith.Plugin[] = []
  private files: Ironsmith.FileMap

  private _rootPath: string = __dirname + '/../'
  private _sourcePath: string = './src'
  private _buildPath: string = './build'
  private _assetsPath: string = './assets'

  private _metadata: Ironsmith.Metadata = {}
  private _clean: boolean = true
  private _loadAssets: boolean = true


  /* Initialize a new `Ironsmith` builder */
  constructor(options?: Ironsmith.Options) {
    if (options !== undefined) {
      if (options.verbose !== undefined) {
        this.verbose = options.verbose
        File.verbose = options.verbose
        delete options.verbose
      }

      if (options.clean !== undefined) {
        this._clean = options.clean
        delete options.clean
      }
    }

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

  get metadata(): Ironsmith.Metadata { return this._metadata }
  set metadata(metadata: Ironsmith.Metadata) { this._metadata = metadata }
  public mergeMetadata(metadata: Ironsmith.Metadata) { merge(this._metadata, metadata) }

  /* --- Other Properties --- */

  get clean(): boolean { return this._clean }
  set verbose(value: boolean) { log.enabled = value }

  /* --- Build Process --- */

  /* Add a 'Ironsmith.Plugin' function to the stack */
  public use(plugin: Ironsmith.Plugin): Ironsmith {
    log(`use(...): Registered plugin "${plugin.name}"`)
    this.plugins.push(plugin)
    return this
  }

  /* Build with the current settings to the destination directory. */
  public async build(): Promise<Ironsmith.FileMap> {
    if (this._clean) {
      log(`build(): Cleaning build directory`)
      await fs.remove(path.join(this._buildPath, '*'))
    }

    await this.process()
    await Ironsmith.dumpDirectory(this.files, this._buildPath)
    return this.files
  }

  /* Process files through plugins without writing the output files. */
  public async process(): Promise<Ironsmith.FileMap> {
    const sources = await Ironsmith.loadDirectory(this._sourcePath)

    if (this._loadAssets) {
      const assets = await Ironsmith.loadDirectory(this._assetsPath, {asset: true})
      this.files = new Map([...sources, ...assets])
    } else {
      this.files = sources
    }

    for (const plugin of this.plugins) {
      await new Promise((next) => {
        console.log(); log(`process(): Running plugin ${plugin.name}`)
        plugin(this.files, this, next)
      })
    }

    return this.files
  }

  /* --- Static FileMap Functions --- */

  /* Abstracts the reading of files so it can be used more abstractly */
  public static async loadDirectory(directory: string, properties?: Ironsmith.File.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap> {
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

      const file = new Ironsmith.File(buffer, `${prefix}${path.relative(directory, name)}`, properties)

      log(` - loaded: ${file.path}${file.asset ? ' (asset)' : ''}`)
      files.set(file.path, file)
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
