# Changelog #

## Future&trade; ##

- [ ] Add a counter for file uses
- [ ] Replace asset/source directories with directory loading list
- [ ] Add support for ignoring certain filetypes

## Release v1.2.0 ##

## Bug Fixes ##

- **MINOR** Fixed minor security issue with unused dependency only present in out-of-sync `package-lock.json` file (Yeah, it's a stretch I know)

## Changes ##

- Logging is now handled by custom fork of debug from one of my other packages; Simplifies logging and gets rid of that nasty pink color (I think)
  - This doesn't affect much functionality (besides the verbose option below) for now; however in the future it may allow for finer-grained controls over log levels
- `Ironsmith.Options.verbose` now can optionally take a value 0 - 2 with 2 being the same as the previous enabled value and 1 being a *new*, lower level of verbosity
- Updated licensing dates for 2019!

## Release v1.1.0 ##

### Bug Fixes ###

- Fixed Windows format paths not being normalized on import

## Release v1.0.6 ##

### Bug Fixes ###

- Failure on compile of TypeScript files fixed

## Release v1.0.5 ##

### Changes ###

- Added a non-static version of the loadDirectory function that loads files directly into the file map

### Known Issues ###

- Causes Typescript to file on compiling for any file

## Release v1.0.4 ##

### Bug Fixes ###

- Fixed cleaning of the build directory actually creating a folder named '*' instead (5539dde)

### Notes ###

## Release v1.0.3 ##

### Omitted Release ###

This release had an issue with npm publishing causing the release to include all previous releases

Version omitted from the repository history due to a *cough* user error during packaging

## Release v1.0.2 ##

### Changes ###

- Finally figured out how npm publishing works
- Cleaned-up [README.md](README.md) looks

## Release v1.0.1 ##

### Changes ###

- Added npm package keywords

### Bug Fixes ###

- Typescript files will fail to compile due to typo in included declaration file

## Release v1.0.0 ##

### Initial Release ###

A stupidly simple, lightweight file processing engine
