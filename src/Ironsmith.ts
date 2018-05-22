/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import deprecated from 'deprecated-decorator'
import * as fs from 'fs-extra'
import { clone, merge } from 'lodash'
import * as path from 'path'
import * as recursive from 'recursive-readdir'


export declare namespace Ironsmith {
  type Plugin = (files: Ironsmith.Files, fe: Ironsmith, next: Ironsmith.Next) => void
  type Files = Map<string, Ironsmith.File>
  type Next = () => void


  interface File {
    contents: Buffer | string | any,
    path?: string,
    asset?: boolean,
    [index: string]: any,
  }


  interface Metadata { [index: string]: any }
}


export class Ironsmith {
  private plugins: Ironsmith.Plugin[] = []
  private files: Ironsmith.Files


  // tslint:disable:variable-name
  private _rootPath: string = __dirname
  private _sourcePath: string = './src'
  private _buildPath: string = './build'
  private _assetsPath: string = './assets'


  private _metadata: Ironsmith.Metadata = {}
  private _clean: boolean = true
  private _loadAssets: boolean = true


  /* Initialize a new `Ironsmith` builder */
  constructor() {
    this.setSourcePath(this._sourcePath)
    this.setSourcePath(this._buildPath)
    this.setSourcePath(this._assetsPath)
  }

  /* Get the current working directory */
  public root(): string { return this._rootPath }


  /* Set the current working directory */
  public setRoot(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._rootPath = path.resolve(directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the root path blank.')
    }


    return this
  }


  /* Get the source directory */
  public sourcePath(): string { return this._sourcePath }


  /* Set the source directory */
  public setSourcePath(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._sourcePath = path.resolve(this._rootPath, directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the source path blank.')
    }


    return this
  }


  /* Get the directory of the output files */
  public buildPath(): string { return this._buildPath }


  /* Set the directory of the output files */
  public setBuildPath(directory: string): Ironsmith {
    if (directory.length > 0) {  // TODO: Check if this is a valid path
      this._buildPath = path.resolve(this._rootPath, directory)
    } else {
      console.warn('Warning! Blatantly refusing to make the build path blank.')
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


  /* Returns either the assets path or false if the feature is disabled */
  public assets(): string | boolean {
    return this._loadAssets ? this._assetsPath : false
  }


  /* Enable or disable the loading of static assets */
  public loadAssets(state: boolean): Ironsmith {
    this._loadAssets = state
    return this
  }


  @deprecated()  // This sounds like a not my problem function @deprecated?
  public ignore(...files: string[]): Ironsmith {
    console.log('Ironsmith.ignore(...) is a deprecated feature from metalsmith.')
    return this
  }


  @deprecated()  // Get whether frontmatter parsing is enabled
  public frontmatter(): boolean {
    console.log('Ironsmith.frontmatter(...) is a deprecated feature from metalsmith.')
    return false
  }


  @deprecated()  // Set whether frontmatter parsing is enabled
  public setFrontmatter(state: boolean): Ironsmith {
    console.log('Ironsmith.setFrontmatter(...) is a deprecated feature from metalsmith.')
    return this
  }


  /* Get whether the destination directory will be removed before writing. */
  public isClean(): boolean { return this._clean }


  /* Set whether the destination directory will be removed before writing. */
  public setClean(state: boolean): Ironsmith {
    this._clean = state
    return this
  }


  /* Returns the currently stored metadata object */
  public metadata(): Ironsmith.Metadata { return this._metadata }


  /* Sets the current metadata to match the object passed */
  public setMetadata(metadata: Ironsmith.Metadata): Ironsmith {
    this._metadata = clone(metadata)
    return this
  }


  /* Merges the current metadata with the object passed */
  public mergeMetadata(metadata: Ironsmith.Metadata): Ironsmith {
    merge(this._metadata, metadata)
    return this
  }


  /* Add a 'Ironsmith.Plugin' function to the stack */
  public use(plugin: Ironsmith.Plugin): Ironsmith {
    this.plugins.push(plugin)
    return this
  }


  /* Build with the current settings to the destination directory. */
  public async build(): Promise<Ironsmith.Files> {
    if (this._clean) {
      await fs.remove(path.join(this._buildPath, '*'))
    }


    this.files = await this.read()
    await this.run(this.files)
    await this.write(this.files)


    return this.files
  }


  /* Process files through plugins without writing the output files. */
  public async process(): Promise<Ironsmith.Files> {
    this.files = await this.read()
    await this.run(this.files)
    return this.files
  }


  /* Run a set of `files` through the plugins stack. */
  private async run(files: Ironsmith.Files) {
    for (const plugin of this.plugins) {
      await new Promise((next) => { plugin(files, this, next) })
    }
  }


  /* Read a dictionary of files from the source directory. */
  private async read(): Promise<Ironsmith.Files> {
    const filenames = await recursive(this._sourcePath)
    const assetnames = this._loadAssets ? await recursive(this._assetsPath) : []


    const sources = await this.readFiles(filenames)
    const assets = await this.readFiles(assetnames, this._assetsPath)


    return new Map([...sources, ...assets])
  }


  /* Abstracts the reading of files so it can be used more abstractly */
  private async readFiles(filenames: string[], root?: string): Promise<Ironsmith.Files> {
    const files: Ironsmith.Files = new Map()
    if (root === undefined) { root = this._sourcePath }


    for (const name of filenames) {
      const buffer = await fs.readFile(name)


      const file: Ironsmith.File = {
        contents: buffer,
        asset: (root === this._assetsPath),
        path: path.relative(root, name),
      }


      files.set(file.path, file)
    }


    return files
  }


  /* Writes the processed files out into the build directory */
  private async write(files: Ironsmith.Files): Promise<Ironsmith.Files> {


    files.forEach(async (file, name) => {
      await fs.mkdirs(path.resolve(this._buildPath, name).split('/').slice(0,-1).join('/'))
      await fs.writeFile(path.resolve(this._buildPath, name), file.contents)
    })


    return files
  }
}
