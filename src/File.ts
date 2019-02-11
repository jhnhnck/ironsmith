/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import { Logger } from './Logger'

const log = new Logger('ironsmith:file')

export class IronsmithFile {
  private static _augmentList: string[] = []
  private static _augments: IronsmithFile.Augment[] = []
  private _tags: IronsmithFile.Tags

  public asset: boolean = false
  public path: string
  public contents: Buffer | string | any

  constructor(contents: Buffer | string | any, path: string, properties?: IronsmithFile.Options) {
    properties = properties || {}

    log.debug(`New file created: ${path} ${JSON.stringify(properties)}`)
    this.contents = contents
    this.path = path

    this._tags = new Set(properties.tags || [])
    if (properties.tags !== undefined) { delete properties.tags }

    Object.assign(this, properties)

    if (IronsmithFile._augments.length > 0) { this.initialize() }
  }

  /* --- Tagging Set Abstraction --- */

  public tag(value: string) { this._tags.add(value) }
  public untag(value: string): boolean { return this._tags.delete(value) }
  public tags(): IterableIterator<string> { return this._tags.values() }
  public tagged(value: string): boolean { return this._tags.has(value) }
  get tagCount(): number { return this._tags.size }

  /* --- File Augments --- */

  private initialize() {
    log.debug(`Running augments [${IronsmithFile._augmentList.join(', ')}] for file: ${this.path}`)
    for (const ftn of IronsmithFile._augments) { ftn(this) }
  }

  static get augmentList(): string[] {
    return Object.assign([], IronsmithFile._augmentList)
  }

  public static addAugment(ftn: IronsmithFile.Augment) {
    log.debug(`Added augment: ${ftn.name}`)
    IronsmithFile._augmentList.push(ftn.name)
    IronsmithFile._augments.push(ftn)
  }

  /* --- Binary Packaging --- */

  public toBSON(): object {
    return {
      asset: this.asset,
      contents: this.contents instanceof Buffer ? this.contents : new Buffer(this.contents),
      path: this.path,
      tags: Array.from(this._tags)
    }
  }
}
