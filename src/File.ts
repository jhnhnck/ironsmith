/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */


import * as debug from 'debug'
const log = debug('ironsmith:file')


export declare namespace File {
  type Augment = (file: File) => any
  type Tags = Set<string>

  interface Options {
    tags?: string[] | File.Tags
    asset?: boolean
    [index: string]: any
  }
}

export interface File {
  contents: Buffer | string | any
  path: string
  [index: string]: any
}

export class File {
  private _tags: File.Tags = new Set()
  public asset: boolean = false

  private static _augments: File.Augment[] = []

  constructor(contents: Buffer | string | any, path: string, properties?: File.Options) {
    log(`New file created: ${path} ${JSON.stringify(properties || {})}`)
    this.contents = contents
    this.path = path

    if (properties !== undefined) {
      if (properties.tags !== undefined) {
        this._tags = new Set(properties.tags)
        delete properties.tags
      }

      Object.assign(this, properties)
    }

    if (File._augments.length > 0) { this.initialize() }
  }

  public static set verbose(value: boolean) { log.enabled = value }

  /* --- Tagging Set Abstraction --- */

  public tag(value: string) { this._tags.add(value) }
  public untag(value: string): boolean { return this._tags.delete(value) }
  public tags(): IterableIterator<string> { return this._tags.values() }
  public tagged(value: string): boolean { return this._tags.has(value) }
  get tagCount(): number { return this._tags.size }

  /* --- File Augments --- */

  private async initialize(): Promise<void> {
    log(`Running augments for file: ${this.path}`)
    for (const ftn of File._augments) {
      log(` - Running augment: ${ftn.name}`)
      await ftn(this)
    }
  }

  public static addAugment(ftn: File.Augment) {
    log(`Added augment: ${ftn.name}`)
    File._augments.push(ftn)
  }
}
