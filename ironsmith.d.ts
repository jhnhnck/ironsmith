/// <reference types="node" />

/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

declare module 'ironsmith' {
  class Ironsmith {
    private plugins
    private files
    private _rootPath
    private _sourcePath
    private _buildPath
    private _assetsPath

    public metadata: Ironsmith.Metadata
    public clean: boolean
    public verbose: boolean

    constructor(options?: Ironsmith.Options)

    /* --- Directories --- */

    rootPath: string
    buildPath: string
    sourcePath: string
    assetsPath: string

    loadSource: boolean
    loadAssets: boolean

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

    /* --- Static FileMap Functions --- */

    static loadDirectory(directory: string, properties?: Ironsmith.File.Options & Ironsmith.LoadOptions): Promise<Ironsmith.FileMap>
    static dumpDirectory(files: Ironsmith.FileMap, directory: string): Promise<void>
  }

  export namespace Ironsmith {
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
      loadSource?: boolean
      metadata?: Metadata
      verbose?: boolean
    }

    interface LoadOptions {
      loadRelative?: string
    }

    /* --- `Ironsmith.File` --- */

    namespace File {
      type Augment = (file: Ironsmith.File) => void
      type Tags = Set<string>

      interface Options {
        tags?: string[] | Ironsmith.File.Tags
        asset?: boolean
        [index: string]: any
      }
    }

    interface File { [index: string]: any }

    class File {
      // private static _augmentList
      // private static _augments
      // private _tags

      asset: boolean
      contents: Buffer | string | any
      path: string
      readonly tagCount: number

      constructor(contents: Buffer | string | any, path: string, properties?: Ironsmith.File.Options)
      static verbose: boolean

      /* --- File Augments --- */

      static readonly augmentList: string[]
      static addAugment(ftn: Ironsmith.File.Augment): void
      // private initialize(): Promise<void>

      /* --- Tagging Set Abstraction --- */

      tag(value: string): void
      untag(value: string): boolean
      tags(): IterableIterator<string>
      tagged(value: string): boolean
    }
  }
}
