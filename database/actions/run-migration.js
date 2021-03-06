const knex = require('../mysql');
const promise = require('bluebird');
const path = require('path');
const fs = require('fs');
const db = knex.client.config.connection.database || null;

console.log(db)

function replaceAll(str, delimiter, replacement) {
    return str.split(delimiter).join(replacement);
}

fs.readdir(
    path.resolve(
        __dirname,
        '../migrations'
    ),
    'utf-8',
    (err, files) => {
        if (err) throw new Error(err)
        return promise.each(files, (fileName) => {
            return new Promise((resolve, reject) => {
                fs.readFile(
                    path.resolve(
                        __dirname,
                        `../migrations/${fileName}`
                    ),
                    'utf-8',
                    (err, sql) => {
                        if (err) reject(err)
                        return knex.raw(replaceAll(sql, '{}', db))
                            .then(resolve)
                    }
                )
            })
        })
            .then(() => {
                console.log('Migrations have run succcessfully in db: ', db)
                return 0;
            })
            .catch(err => {
                throw new Error(err)
            })
    }
)
