CREATE TABLE IF NOT EXISTS {}.file_links (
    id INT(12) NOT NULL auto_increment PRIMARY KEY,
    file_path VARCHAR(300) NOT NULL UNIQUE,
    expiration VARCHAR(10) NOT NULL,
    jwt VARCHAR(300) NOT NULL,
    email_from VARCHAR(30) NOT NULL,
    email_to VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)
