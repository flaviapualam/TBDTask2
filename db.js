const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "GRB",
    password: "Fhpduadua22",
    port: "5432",
});

module.exports = pool;