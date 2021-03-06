/// <reference types="node" />

/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

declare namespace IronsmithFile {
  type Augment = (file: IronsmithFile) => void
  type Tags = Set<string>

  interface Options {
    tags?: string[] | IronsmithFile.Tags
    asset?: boolean
    [index: string]: any
  }
}

declare interface IronsmithFile { [index: string]: any }

declare class IronsmithFile {
  // private static _augmentList
  // private static _augments
  // private _tags

  asset: boolean
  contents: Buffer | string | any
  path: string
  readonly tagCount: number

  constructor(contents: Buffer | string | any, path: string, properties?: IronsmithFile.Options)

  /* --- File Augments --- */

  static readonly augmentList: string[]
  static addAugment(ftn: IronsmithFile.Augment): void
  // private initialize(): Promise<void>

  /* --- Tagging Set Abstraction --- */

  tag(value: string): void
  untag(value: string): boolean
  tags(): IterableIterator<string>
  tagged(value: string): boolean

  /* --- Binary Packaging --- */

  toBSON(): object
}

declare namespace Ironsmith {
  type FileMap = Map<string, IronsmithFile>
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
    loadSource?: boolean
    metadata?: Metadata
    verbose?: boolean | 0 | 1 | 2
  }

  interface LoadOptions {
    loadRelative?: string
  }
}

declare class Ironsmith {
  // private plugins
  // private files
  // private _rootPath
  // private _sourcePath
  // private _buildPath
  // private _assetsPath
  // private _metadata

  constructor(options?: Ironsmith.Options)

  /* --- Directories --- */

  rootPath: string
  buildPath: string
  sourcePath: string
  assetsPath: string

  loadSource: boolean
  loadAssets: boolean

  /* --- Other Properties --- */

  metadata: Ironsmith.Metadata
  clean: boolean
  verbose: boolean | 0 | 1 | 2

  /* --- Build Initialization --- */

  /* Add a 'Ironsmith.Plugin' function to the stack */
  use(plugin: Ironsmith.Plugin): Ironsmith

  /* Add a file to the Ironsmith instance before building/processing */
  addFile(path: string, file: IronsmithFile): void

  /* --- Build Process --- */

  /* Build with the current settings to the destination directory. */
  build(): Promise<Ironsmith.FileMap>

  /* Process files through plugins without writing the output files. */
  process(): Promise<Ironsmith.FileMap>

  /* --- File Functions --- */

  /* Loads all of the files contained within a directory into the file map as if it were loaded from the source directory */
  loadDirectory(directory: string, properties?: IronsmithFile.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap>

  /* --- Static File Functions --- */

  static loadDirectory(directory: string, properties?: IronsmithFile.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap>
  static dumpDirectory(directory: string, files: Ironsmith.FileMap): Promise<void>
}
