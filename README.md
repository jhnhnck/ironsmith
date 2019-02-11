# Ironsmith #

[![npm-version](https://img.shields.io/npm/v/ironsmith.svg)](https://www.npmjs.com/package/ironsmith)
[![npm-download-qm](https://img.shields.io/npm/dm/ironsmith.svg)](https://www.npmjs.com/package/ironsmith)

A stupidly simple, lightweight file processing engine

By default, Ironsmith does absolutely nothing. Everything is controlled by what you enable and extend.
**All** the logic is handled by extensions, with each one modifying a set of files before handing off to the next extension.

## Installation ##

```
$ npm install ironsmith
```

```
$ yarn add ironsmith
```

## Basic Usage ##

```js
const Ironsmith = require('ironsmith').Ironsmith

const fe = new Ironsmith({ rootPath: __dirname })

fe.use(logRemoveExtension)
  .use(someOtherExtension)
  .build()
    .then(() => console.log('Process complete'))
```

## Extensions ##

Extensions are simply functions with the following signature (TypeScript formatting)

```typescript
(files: Ironsmith.FileMap, fe: Ironsmith, next: Ironsmith.Next) => void
```

The first argument is a `Map<string, Ironsmith.File>` containing a working set of files that are being used

The second argument is the `Ironsmith` object itself (Useful for modifying metadata or changing configuration after the processing has started)

The final argument is simply a callback function to allow Ironsmith to proceed to the next extension

### Example ###

```js
const path = require('path')

function logRemoveExtension(files, fe, next) {
  files.forEach((name, files) => {
    if (path.extname(name) === 'log') {
      files.delete(name)
    }
  })

  next()
}
```

## Augments ##

Augments are ran when the `Ironsmith.File` object is first created. These can be used to parse data,
identify the file type, or remove the file by throwing an error.

```typescript
(file: Ironsmith.File) => void
```

An augment takes created file as its only argument and can use any of the file methods below directly on this object

### Example ###

```js
const path = require('path')
const ignoredList = ['error.log', 'tmpdir/', 'example.txt']

function IgnoreAugment(file) {
  for (const value of ignoredList) {
    if (file.path.startsWith(value) || path.basename(file.path).startsWith(value)) {
      throw new Error('File marked as ignored')
    }
  }
}
```

---

## Ironsmith API ##

### new Ironsmith(options?) ##

Initializes a new Ironsmith instance; An optional options parameter can be passed with valid options
being `Ironsmith.Options` (see interfaces below)

### #use(extension) ###

Add an Ironsmith extension to the stack; Returns the Ironsmith instance (useful for chaining)

### #addFile(path, file) ###

Add a file to the Ironsmith instance before building or processing

### #process() ###

Run through each extension with the loaded files; Returns a promise

### #build() ###

Same as process but saves files to `buildPath` after running; Returns a promise

### #loadDirectory(path, options?) ###

Adds all files contained within the path to the Ironsmith instance as if they were loaded from the source directory; An optional options
parameter can be passed with valid options being those from `Ironsmith.File.Options` and `Ironsmith.LoadOptions`; Returns the new files object

## Ironsmith Static API ##

### #loadDirectory(path, options?) ###

Returns an `Ironsmith.FileMap` object with all the files contained within the path; An optional options
parameter can be passed with valid options being those from `Ironsmith.File.Options` and `Ironsmith.LoadOptions`

### #dumpDirectory(path, files) ###

Dumps the files contained in an `Ironsmith.FileMap` to the directory provided; subdirectories will be created
if they do not already exist

### Properties ###

All values within the `Ironsmith.Options` interface can be directly accessed as public properties of the `Ironsmith` instance.
However modification of these values after initialization may lead to unexpected results. Metadata is provided solely for easy access
to options and information within extensions

## Ironsmith.File API ##

### new Ironsmith.File(contents, path, options?) ###

Creates a new `Ironsmith.File` object with the provided contents (in the form of a buffer or string). The path should be passed
to this constructor but is not updated automatically if changed within the File Map therefore is only useful for reference in Augments.
An optional options parameter can be passed with valid options being `Ironsmith.File.Options`.

### #tag(value) ###

Add a string tag to the list of tags associated with that file

### #untag(value) ###

Remove a string tag from the list of tags (returns true if value is actually removed)

### #tags() ###

Returns all the currently associated tags; This is in the form of an Iterator so `for (const tag of file.tags()) { }` is a valid use of this function

### #tagged(value) ###

Returns true if the provided value is a tag currently associated with the file and false otherwise

### #toBSON() ###

Serialization support for Binary JSON (BSON) conversion of `Ironsmith.File`s, useful for exporting with metadata included

### Properties ###

The `Ironsmith.File` object is created in such a way as to promote the assigning of other arbitrary values into the object, useful for instance
the deserialization of a JSON file into properties of the file object itself

## Ironsmith.File Static API ##

### #addAugment(ftn) ###

Add a Augment function to the set of augments ran on the creation of a `Ironsmith.File` object

---

## Interfaces ##

### Ironsmith.Options ###

```typescript
interface {
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
```

### Ironsmith.File.Options ###

```typescript
interface {
  tags?: string[] | Ironsmith.File.Tags
  asset?: boolean
  [index: string]: any
}
```

### Ironsmith.LoadOptions ###

```typescript
interface {
  loadRelative?: string
}
```

---

## License ##

This software is licensed under the MIT License (MIT)

Copyright © 2016-2019 John Hancock <john@dev.jhnhnck.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
