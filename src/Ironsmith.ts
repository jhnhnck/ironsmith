/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import * as fs from 'fs-extra'
import { clone, merge } from 'lodash'
import * as path from 'path'
import * as recursive from 'recursive-readdir'

import { File } from './File'
export declare namespace Ironsmith {
  type FileMap = Map<string, Ironsmith.File>
  type Next = () => void
  type Plugin = (files: Ironsmith.FileMap, fe: Ironsmith, next: Ironsmith.Next) => void
  interface Metadata { [index: string]: any }

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
    tags: File.Tags
    [index: string]: any
  }

  class File {
    private static _augment

    constructor(contents: Buffer | string | any, path: string, properties?: File.Options)
    private initialize()

    public static addAugment(ftn: File.Augment): void
  }
}

export class Ironsmith {
  private plugins: Ironsmith.Plugin[] = []
  private files: Ironsmith.FileMap

  private _rootPath: string = __dirname
  private _sourcePath: string = './src'
  private _buildPath: string = './build'
  private _assetsPath: string = './assets'

  private _metadata: Ironsmith.Metadata = {}
  private _clean: boolean = true
  private _loadAssets: boolean = true


  /* Initialize a new `Ironsmith` builder */
  constructor(directory?: string) {
    this.setRoot(directory || this._rootPath)
    this.setSourcePath(this._sourcePath)
    this.setBuildPath(this._buildPath)
    this.setAssetsPath(this._assetsPath)
  }

  /* Get the current working directory */
  public root(): string { return this._rootPath }

  /* Get the directory of the output files */
  public buildPath(): string { return this._buildPath }

  /* Get the source directory */
  public sourcePath(): string { return this._sourcePath }

  /* Returns either the assets path or false if the feature is disabled */
  public assetsPath(): string | boolean { return this._loadAssets ? this._assetsPath : false }

  /* Enable or disable the loading of static assets */
  public loadAssets(state: boolean): Ironsmith { this._loadAssets = state; return this }

  /* Get whether the destination directory will be removed before writing. */
  public isClean(): boolean { return this._clean }

  /* Set whether the destination directory will be removed before writing. */
  public setClean(state: boolean): Ironsmith { this._clean = state; return this }

  /* Returns the currently stored metadata object */
  public metadata(): Ironsmith.Metadata { return this._metadata }

  /* Sets the current metadata to match the object passed */
  public setMetadata(metadata: Ironsmith.Metadata): Ironsmith { this._metadata = clone(metadata); return this }

  /* Merges the current metadata with the object passed */
  public mergeMetadata(metadata: Ironsmith.Metadata): Ironsmith { merge(this._metadata, metadata); return this }

  /* Set the current working directory */
  public setRoot(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._rootPath = path.resolve(directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the root path blank.')
    }

    return this
  }

  /* Set the directory of the output files */
  public setBuildPath(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._buildPath = path.resolve(this._rootPath, directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the build path blank.')
    }

    return this
  }

  /* Set the source directory */
  public setSourcePath(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._sourcePath = path.resolve(this._rootPath, directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the source path blank.')
    }

    return this
  }

  /* Specify an alternative directory for loading additional static files */
  public setAssetsPath(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._assetsPath = path.resolve(this._rootPath, directory)
    } else {
      this._loadAssets = false
    }

    return this
  }

  /* Add a 'Ironsmith.Plugin' function to the stack */
  public use(plugin: Ironsmith.Plugin): Ironsmith { this.plugins.push(plugin); return this }

  /* Build with the current settings to the destination directory. */
  public async build(): Promise<Ironsmith.FileMap> {
    if (this._clean) { await fs.remove(path.join(this._buildPath, '*')) }

    await this.process()
    await Ironsmith.dumpDirectory(this.files, this._buildPath)
    return this.files
  }

  /* Process files through plugins without writing the output files. */
  public async process(): Promise<Ironsmith.FileMap> {
    const sources = await Ironsmith.loadDirectory(this._sourcePath, {asset: false})
    const assets = await Ironsmith.loadDirectory(this._assetsPath, {asset: true})
    this.files = new Map([...sources, ...assets])

    for (const plugin of this.plugins) {
      await new Promise((next) => { plugin(this.files, this, next) })
    }

    return this.files
  }

  /* --- Static FileMap Functions --- */

  /* Abstracts the reading of files so it can be used more abstractly */
  public static async loadDirectory(directory: string, properties?: Ironsmith.File.Options): Promise<Ironsmith.FileMap> {
    const filenames = await recursive(path.resolve(directory))
    const files: Ironsmith.FileMap = new Map()

    for (const name of filenames) {
      const buffer = await fs.readFile(name)

      const file = new Ironsmith.File(buffer, path.relative(directory, name), properties)

      files.set(file.path, file)
    }

    return files
  }

  /* Writes a `Ironsmith.FileMap` into directory */
  public static async dumpDirectory(files: Ironsmith.FileMap, directory: string): Promise<void> {
    files.forEach(async (file, name) => {
      const absPath = path.resolve(directory, name)

      await fs.mkdirs(path.dirname(absPath))
      await fs.writeFile(absPath, file.contents)
    })
  }
}
