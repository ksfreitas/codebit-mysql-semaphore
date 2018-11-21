const mysql = require('mysql');

function CodebitMysqlSemaphore(mysqlConfig, lockName, timeout) {
    this.lockName = lockName;
    this.timeout = timeout;
    this.connection = mysql.createConnection(mysqlConfig);
    this.locked = false;
    this.connection.on('error', function (err) {
        console.error(err);
    });

    const self = this;

    this.lock = () => {
        return new Promise((resolve, reject) => {
            self.connection.query('SELECT GET_LOCK(' + mysql.escape(self.lockName) + ', ' + mysql.escape(self.timeout) + ') AS result',
                (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (rows != null && rows.length != 0 && rows[0].result == 1) {
                            self.locked = true;
                            resolve({didLock: true, release: self.release});
                        } else {
                            try {
                                self.release();
                            } finally {
                                resolve({didLock: false});
                            }
                        }
                    }
                });
        });
    };

    this.release = () => {
        if (self.locked) {
            self.connection.query('SELECT RELEASE_LOCK(' + mysql.escape(self.lockName) + ')',
                (err, rows) => {
                    if (err) {
                        console.error(err);
                    }
                    self.connection.end();
                });
        } else {
            self.connection.end();
        }
    };
}

module.exports = CodebitMysqlSemaphore;