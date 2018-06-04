/*!
 * Ironsmith File Processing Engine
 * Author(s): John Hancock <john@dev.jhnhnck.com>
 */

require('source-map-support').install()

exports.Ironsmith = require('./bin/Ironsmith').Ironsmith
exports.Ironsmith.File = require('./bin/File').IronsmithFile
