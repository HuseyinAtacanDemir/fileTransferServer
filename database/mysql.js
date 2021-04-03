require('dotenv').config()

let config = {
    client: "mysql2",
    connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.TEST === "true" ? process.env.MYSQL_DB_TEST : process.env.MYSQL_DB,
        multipleStatements: true
    }
}
console.log(config.connection.database)
module.exports = require('knex')(config)