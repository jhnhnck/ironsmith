/*!
 * Currently a part of the 'Ironsmith File Processing Engine'
 * - Lightweight Logger based off of 'Debug'
 *
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

import chalk from 'chalk'

class Logger {
  private static paddingLength = -1
  private static outputLevel = 0

  private namespace: string
  private colors: number[] = [6, 2, 3, 4, 5, 1]

  private _color: number
  private _prefix: string

  constructor(namespace: string) {
    this.namespace = namespace
    Logger.paddingLength = Math.max(Logger.paddingLength, this.namespace.length)

    /* --- Colors --- */
    if (chalk.level >= 2) {
      this.colors = [  // Removed: 21, 40, 57
          1,   2,   3,   4,   5,   6,
         20,  26,  27,  32,  33,  38,  39,  41,
         42,  43,  44,  45,  56,  62,  63,  68,  69,
         74,  75,  76,  77,  78,  79,  80,  81,  92,  93,
         98,  99, 112, 113, 128, 129, 134, 135, 148, 149,
        160, 161, 162, 163, 164, 165, 166, 167, 168, 169,
        170, 171, 172, 173, 178, 179, 184, 185, 196, 197,
        198, 199, 200, 201, 202, 203, 204, 205, 206, 207,
        208, 209, 214, 215, 220, 221
      ]
    }
  }

  /* --- Static Methods --- */

  /* 0 = Normal Output; 1 = Verbose Output; 2 = Debug Output */
  public static setLevel(level: number) {
    if (level < 0 || level > 2) {
      throw new Error(`Logger level must be one of 0, 1, 2; Got ${level}`)
    } else {
      Logger.outputLevel = level
    }
  }

  public static getLevel() {
    return Logger.outputLevel
  }

  /* --- Repetitive Logging Methods --- */

  public fatal(text: string, ...args: any[]) {
    this.logTo('stderr', chalk.red.bold('!fatal '), text, ...args)
  }

  public err(text: string, ...args: any[]) {
    this.logTo('stderr', chalk.red.bold('!error '), text, ...args)
  }

  public warn(text: string, ...args: any[]) {
    this.logTo('stderr', chalk.yellow.bold('!warn '), text, ...args)
  }

  public info(text: string, ...args: any[]) {
    this.logTo('stdout', '', text, ...args)
  }

  public title(text: string, ...args: any[]) {
    process.stdout.write('\n')
    this.logTo('stdout', '', chalk.bold.underline(text), ...args)
  }

  public verbose(text: string, ...args: any[]) {
    if (Logger.outputLevel < 1) { return }
    this.logTo('stdout', chalk.blue.bold('!verbose '), text, ...args)
  }

  public debug(text: string, ...args: any[]) {
    if (Logger.outputLevel < 2) { return }
    this.logTo('stdout', chalk.cyan.bold('!debug '), text, ...args)
  }

  /* --- Private Functions --- */

  private logTo(stream: 'stdout' | 'stderr', keyword: string, text: string, ...args: any[]) {
    const output: string[] = []
    let extra: string

    for (const line of text.split('\n')) {
      output.push(`${this.prefix} ${keyword}${line}`)
    }

    if (args !== undefined) {
      const stack = []
      for (const arg of args) {
        if (typeof arg === 'string') {
          stack.push(...arg.split('\n'))
        } else {
          stack.push(...JSON.stringify(arg, null, 2).split('\n'))
        }
      }
      extra = chalk.hex('#767676')(stack.join('\n'))
    }

    text = `${output.join('\n')}${extra.length > 0 ? '\n' : ''}${extra}${chalk.reset()}\n`

    if (stream === 'stdout') {
      process.stdout.write(text)
    } else {
      process.stderr.write(text)
    }
  }

  private get prefix() {
    if (this._prefix === undefined) {
      this._prefix = `\u001B[3${this.color < 8 ? this.color : `8;5;${this.color}`};1m${this.namespace.padStart(Logger.paddingLength)}\u001B[0m`
    }

    if (!chalk.supportsColor) {
      this._prefix = `${new Date().toISOString()} ${this.namespace}`
    }

    return this._prefix
  }

  /**
   * Select random color from hash.
   *
   * Generates a DJB2 hash of the namespace to select a random color from those available;
   * Taken partially from original 'debug' code, except with the method properly implemented
   */
  private get color(): number {
    if (this._color === undefined) {
      let hash = 5381

      for (const char of Buffer.from(this.namespace)) {
        hash = ((hash << 5) + hash + char) | 0
      }

      this._color = this.colors[Math.abs(hash) % this.colors.length]
    }

    return this._color
  }
}

export { Logger }
