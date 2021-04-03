const fs = require('fs');
const path = require('path');

let tableName;

try {
    tableName = process.argv.find(
        (arg) =>  arg.includes('--tablename=')
        ).split('=')[1];
} catch (error) {
    return console.error('Error: --tablename parameter not found. Please specify a table name', error);
}

const fileName = new Date().getTime() + `_${tableName}.sql`;

fs.writeFile(path.resolve(__dirname, `../migrations/${fileName}`), '', (err) => {
    if(err) throw new Error(err);
    console.log('Created new migration file in:', path.resolve(__dirname, `../migrations/${fileName}`));
});