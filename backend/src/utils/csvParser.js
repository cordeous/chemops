const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { Readable } = require('stream');

const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(buffer.toString());
    stream.pipe(csv())
      .on('data', row => results.push(row))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const toCSV = (data, fields) => {
  const parser = new Parser({ fields });
  return parser.parse(data);
};

module.exports = { parseCSVBuffer, toCSV };
