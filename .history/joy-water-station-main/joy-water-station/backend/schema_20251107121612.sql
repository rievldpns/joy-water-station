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
  isBlocked BOOLEAN DEFAULT FALSE,
  isHidden BOOLEAN DEFAULT FALSE
);

INSERT IGNORE INTO users (username, email, password, firstName, lastName, phone, address, role, createdAt, lastLogin, isBlocked)
VALUES ('admin', 'admin@joywater.com', '$2b$10$0Zx40xLfmK81PVFfoF.nrO9Clwfxjf76D5j5QgpZka/rGQSrZzb66', 'Sarah', 'Admin', '09123456789', 'Davao City', 'Administrator', '2024-01-15', '2024-08-27', FALSE);

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
  currentStock INT DEFAULT 0,
  minStock INT DEFAULT 0,
  maxStock INT DEFAULT 0,
  description TEXT
);

INSERT IGNORE INTO items (id, name, category, price, uom, currentStock, minStock, maxStock, description) VALUES
(1, 'Full Water Gallon', 'Water Products', 25.00, 'Gallon', 45, 10, 100, '5-gallon container filled with purified drinking water'),
(2, 'Refilled Water Gallon', 'Water Products', 15.00, 'Gallon', 8, 15, 80, '5-gallon container refilled with purified drinking water'),
(3, 'Empty Water Gallon', 'Containers', 5.00, 'Gallon', 25, 5, 50, 'Empty 5-gallon reusable water container'),
(4, 'Stickers', 'Accessories', 2.00, 'Pack', 120, 20, 200, 'Decorative stickers for water bottles (pack of 10)'),
(5, 'Lids', 'Accessories', 3.00, 'Piece', 2, 10, 100, 'Replacement lids for 5-gallon water containers');

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  email VARCHAR(100),
  customerType ENUM('Regular', 'Wholesale', 'Corporate') DEFAULT 'Regular',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hidden BOOLEAN DEFAULT FALSE
);

INSERT IGNORE INTO customers (id, name, phone, address, email, customerType, createdAt, hidden) VALUES
(1, 'Walk-in Customer', '', '', '', 'Regular', '2024-01-15', FALSE),
(2, 'Juan Dela Cruz', '09123456789', 'Davao City', 'juan@example.com', 'Regular', '2024-01-16', FALSE),
(3, 'ABC Store', '09129876543', 'Tagum City', 'abc@store.com', 'Wholesale', '2024-01-17', FALSE);

CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId VARCHAR(20) UNIQUE NOT NULL,
  date DATE NOT NULL,
  customerId INT,
  customerType ENUM('Regular', 'Wholesale', 'Corporate') DEFAULT 'Regular',
  items JSON NOT NULL, -- Store items as JSON array: [{itemId, quantity, price}]
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  paymentMethod ENUM('Cash', 'GCash', 'Bank Transfer') DEFAULT 'Cash',
  status ENUM('Pending', 'Completed') DEFAULT 'Completed',
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemId INT NOT NULL,
  type ENUM('Stock In', 'Stock Out') NOT NULL,
  quantity INT NOT NULL,
  reason VARCHAR(255),
  userId INT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (itemId) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deliveryId VARCHAR(20) UNIQUE NOT NULL,
  customerName VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255) NOT NULL,
  items JSON NOT NULL, -- Store items as JSON array: [{name, quantity}]
  status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  scheduledTime DATETIME,
  estimatedTime VARCHAR(50),
  distance VARCHAR(50),
  currentLocation JSON, -- Store as JSON: {lat, lng}
  destinationLocation JSON, -- Store as JSON: {lat, lng}
  progress DECIMAL(5,2) DEFAULT 0, -- Progress percentage (0-100)
  lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO deliveries (deliveryId, customerName, phone, address, items, status, priority, scheduledTime, estimatedTime, distance, currentLocation, destinationLocation) VALUES
('DEL-001', 'Juan Dela Cruz', '09123456789', 'Davao City, Philippines', '[{"name": "Full Water Gallon", "quantity": 2}]', 'pending', 'normal', '2024-10-27 14:00:00', '2 hours', '5.2 km', '{"lat": 7.1907, "lng": 125.4553}', '{"lat": 7.1907, "lng": 125.4553}'),
('DEL-002', 'Maria Santos', '09129876543', 'Tagum City, Philippines', '[{"name": "Full Water Gallon", "quantity": 1}, {"name": "Empty Water Gallon", "quantity": 1}]', 'in-progress', 'high', '2024-10-27 15:30:00', '1.5 hours', '3.8 km', '{"lat": 7.1907, "lng": 125.4553}', '{"lat": 7.1907, "lng": 125.4553}'),
('DEL-003', 'ABC Store', '09121234567', 'Panabo City, Philippines', '[{"name": "Full Water Gallon", "quantity": 5}]', 'completed', 'normal', '2024-10-27 10:00:00', '45 mins', '8.1 km', '{"lat": 7.1907, "lng": 125.4553}', '{"lat": 7.1907, "lng": 125.4553}');

