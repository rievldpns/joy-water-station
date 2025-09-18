CREATE DATABASE IF NOT EXISTS joy_water_station;

USE joy_water_station;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(50),
  lastName VARCHAR(50),
  phone VARCHAR(20),
  address VARCHAR(255),
  role ENUM('User', 'Administrator') DEFAULT 'User',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastLogin TIMESTAMP NULL,
  isBlocked BOOLEAN DEFAULT FALSE
);

INSERT IGNORE INTO users (username, email, password, firstName, lastName, phone, address, role, createdAt, lastLogin, isBlocked)
VALUES ('admin', 'admin@joywater.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Admin', '09123456789', 'Davao City', 'Administrator', '2024-01-15', '2024-08-27', FALSE);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  cost DECIMAL(10,2),
  price DECIMAL(10,2),
  uom VARCHAR(20),
  currentStock INT DEFAULT 0,
  minStock INT DEFAULT 0,
  maxStock INT DEFAULT 0,
  description TEXT
);

INSERT IGNORE INTO products (id, name, category, cost, price, uom, currentStock, minStock, maxStock, description) VALUES
(1, 'Full Water Gallon', 'Water Products', 20.00, 25.00, 'Gallon', 45, 10, 100, '5-gallon container filled with purified drinking water'),
(2, 'Refilled Water Gallon', 'Water Products', 12.00, 15.00, 'Gallon', 8, 15, 80, '5-gallon container refilled with purified drinking water'),
(3, 'Empty Water Gallon', 'Containers', 3.00, 5.00, 'Gallon', 25, 5, 50, 'Empty 5-gallon reusable water container'),
(4, 'Stickers', 'Accessories', 1.00, 2.00, 'Pack', 120, 20, 200, 'Decorative stickers for water bottles (pack of 10)'),
(5, 'Lids', 'Accessories', 1.50, 3.00, 'Piece', 2, 10, 100, 'Replacement lids for 5-gallon water containers');

CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  price DECIMAL(10,2),
  uom VARCHAR(20),
  description TEXT
);

INSERT IGNORE INTO items (id, name, category, price, uom, description) VALUES
(1, 'Full Water Gallon', 'Water Products', 25.00, 'Gallon', '5-gallon container filled with purified drinking water'),
(2, 'Refilled Water Gallon', 'Water Products', 15.00, 'Gallon', '5-gallon container refilled with purified drinking water'),
(3, 'Empty Water Gallon', 'Containers', 5.00, 'Gallon', 'Empty 5-gallon reusable water container'),
(4, 'Stickers', 'Accessories', 2.00, 'Pack', 'Decorative stickers for water bottles (pack of 10)'),
(5, 'Lids', 'Accessories', 3.00, 'Piece', 'Replacement lids for 5-gallon water containers');
