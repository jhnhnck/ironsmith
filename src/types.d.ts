/// <reference types="node" />

/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

export declare namespace Ironsmith {
  type FileMap = Map<string, Ironsmith.File>
  type Next = () => void

  type Plugin = (files: Ironsmith.FileMap, fe: Ironsmith, next: Ironsmith.Next) => void

  interface File {
      contents: Buffer | string | any
      path?: string
      asset?: boolean
      [index: string]: any
  }

  interface Metadata {
      [index: string]: any
  }
}

export declare class Ironsmith {
  private plugins: Ironsmith.Plugin
  private files: Ironsmith.FileMap

  private _rootPath: string
  private _sourcePath: string
  private _buildPath: string
  private _assetsPath: string

  private _metadata: Ironsmith.Metadata
  private _clean: boolean
  private _loadAssets: boolean

  /* Initialize a new `Ironsmith` builder */
  constructor(directory?: string)

  /* Get the current working directory */
  root(): string

  /* Set the current working directory */
  setRoot(directory: string): Ironsmith

  /* Get the source directory */
  sourcePath(): string

  /* Set the source directory */
  setSourcePath(directory: string): Ironsmith

  /* Get the directory of the output files */
  buildPath(): string

  /* Set the directory of the output files */
  setBuildPath(directory: string): Ironsmith

  /* Specify an alternative directory for loading additional static files */
  setAssetsPath(directory: string): Ironsmith

  /* Returns either the assets path or false if the feature is disabled */
  assets(): string | boolean

  /* Enable or disable the loading of static assets */
  loadAssets(state: boolean): Ironsmith

  /* Set whether the destination directory will be removed before writing. */
  isClean(): boolean

  /* Set whether the destination directory will be removed before writing. */
  setClean(state: boolean): Ironsmith

  /* Returns the currently stored metadata object */
  metadata(): Ironsmith.Metadata

  /* Sets the current metadata to match the object passed */
  setMetadata(metadata: Ironsmith.Metadata): Ironsmith

  /* Merges the current metadata with the object passed */
  mergeMetadata(metadata: Ironsmith.Metadata): Ironsmith

  /* Add a 'Ironsmith.Plugin' function to the stack */
  use(plugin: Ironsmith.Plugin): Ironsmith

  /* Build with the current settings to the destination directory. */
  build(): Promise<Ironsmith.FileMap>

  /* Process files through plugins without writing the output files. */
  process(): Promise<Ironsmith.FileMap>

  /* Abstracts the reading of files so it can be used more abstractly */
  static loadDirectory(directory: string, tags?: object): Promise<Ironsmith.FileMap>

  /* Writes a `Ironsmith.FileMap` into directory */
  static dumpDirectory(files: Ironsmith.FileMap, directory: string): Promise<void>
}
