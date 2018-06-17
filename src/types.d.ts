/// <reference types="node" />

/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

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
    static verbose: boolean

    /* --- File Augments --- */

    static addAugment(ftn: File.Augment): void
    private initialize(): void

    /* --- Tagging Set Abstraction --- */

    public tag(value: string): void
    public untag(value: string): boolean
    public tags(): IterableIterator<string>
    public tagged(value: string): boolean
  }
}

export declare class Ironsmith {
  private plugins
  private files
  private _rootPath
  private _sourcePath
  private _buildPath
  private _assetsPath
  private _metadata
  private _clean
  private _loadAssets

  constructor(options?: Ironsmith.Options)

  /* --- Directories --- */

  rootPath: string
  buildPath: string
  sourcePath: string
  assetsPath: string

  /* --- Other Properties --- */

  metadata: Ironsmith.Metadata
  clean: boolean
  verbose: boolean

  /* --- Build Process --- */

  /* Add a 'Ironsmith.Plugin' function to the stack */
  use(plugin: Ironsmith.Plugin): Ironsmith

  /* Build with the current settings to the destination directory. */
  build(): Promise<Ironsmith.FileMap>

  /* Process files through plugins without writing the output files. */
  process(): Promise<Ironsmith.FileMap>

  /* --- Static FileMap Functions --- */

  static loadDirectory(directory: string, properties?: Ironsmith.File.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap>
  static dumpDirectory(files: Ironsmith.FileMap, directory: string): Promise<void>
}
