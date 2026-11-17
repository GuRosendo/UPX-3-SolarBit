CREATE DATABASE IF NOT EXISTS UPX_3;

USE UPX_3;

-- GUSTAVO ROSENDO CARDOSO
-- 14/09/2026

CREATE TABLE IF NOT EXISTS users(
	id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    PRIMARY KEY(id),
    UNIQUE KEY uk_users_email(email),
    
    INDEX idx_users_login(email, deleted_at),
    INDEX idx_users_name(first_name, last_name),
    INDEX idx_users_deleted_at(deleted_at),
    INDEX idx_users_created_at(created_at)
) COMMENT 'Usuários';

CREATE TABLE IF NOT EXISTS user_addresses(
	id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    cep CHAR(8) NULL,
    state_id INT NULL,
    city_id INT NULL,
    neighborhood VARCHAR(255) NULL,
    house_number CHAR(10) NOT NULL,
    not_found_address_informations VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    PRIMARY KEY(id),
    
    CONSTRAINT fk_user_addresses_users FOREIGN KEY(user_id) REFERENCES users(id),
    
    INDEX idx_user_addresses_deleted_at(deleted_at),
    INDEX idx_user_addresses_created_at(created_at)
) COMMENT 'Endereço dos usuários';

CREATE TABLE IF NOT EXISTS home_appliances(
	id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
	name VARCHAR(255) NOT NULL,
    power_consumption DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
	PRIMARY KEY(id),
    
    CONSTRAINT fk_home_appliances_users FOREIGN KEY(user_id) REFERENCES users(id),
    
	INDEX idx_home_appliances_deleted_at(deleted_at),
    INDEX idx_home_appliances_created_at(created_at)
) COMMENT 'Consumo do eletrodoméstico por hora de uso';

CREATE TABLE IF NOT EXISTS power_consumption_times(
	id INT NOT NULL AUTO_INCREMENT,
    home_appliance_id INT NOT NULL,
    hour_start TIME NOT NULL,
    hour_end TIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    
    PRIMARY KEY(id),
    
    CONSTRAINT fk_power_consumption_times_home_appliances FOREIGN KEY(home_appliance_id) REFERENCES home_appliances(id),
    
    INDEX idx_power_consumption_times_deleted_at(deleted_at),
    INDEX idx_power_consumption_times_created_at(created_at)
) COMMENT 'Tempo de uso dos eletrodomésticos na casa do usuário';