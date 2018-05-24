/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

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
  public tags: File.Tags = new Set()
  public asset: boolean = false

  private static _augment: File.Augment[]

  constructor(contents: Buffer | string | any, path: string, properties?: File.Options) {
    this.contents = contents
    this.path = path

    if (properties !== undefined) {
      if (properties.tags !== undefined) {
        this.tags = new Set(properties.tags)
        delete properties.tags
      }

      Object.assign(this, properties)
    }

    if (File._augment.length > 0) { this.initialize() }
  }

  private async initialize(): Promise<void> {
    for (const ftn of this._augment) { await ftn(this) }
  }

  public static addAugment(ftn: File.Augment) {
    File._augment.push(ftn)
  }
}
