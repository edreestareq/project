-- ========================================================
-- KARAJAK AI Database Schema (3NF) - Middle East University
-- Platform: Web-Based Car Sales Platform Powered by AI
-- ========================================================

CREATE DATABASE IF NOT EXISTS KarajakDb;
USE KarajakDb;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS Users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    PhoneNumber VARCHAR(20) DEFAULT '',
    Role VARCHAR(20) NOT NULL DEFAULT 'Buyer',
    IsActive BOOLEAN DEFAULT TRUE,
    IsVerified BOOLEAN DEFAULT FALSE,
    ProfilePicture VARCHAR(255) NULL,
    VerificationDocument VARCHAR(255) NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cars Table
CREATE TABLE IF NOT EXISTS Cars (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    SellerId INT NOT NULL,
    Brand VARCHAR(50) NOT NULL,
    Model VARCHAR(50) NOT NULL,
    Year SMALLINT NOT NULL,
    Price DECIMAL(12,2) NOT NULL,
    Mileage INT NOT NULL,
    FuelType VARCHAR(30) DEFAULT 'Petrol',
    Transmission VARCHAR(30) DEFAULT 'Automatic',
    Color VARCHAR(30) DEFAULT 'Black',
    Location VARCHAR(100) DEFAULT 'Amman, Jordan',
    Description TEXT,
    Status VARCHAR(30) DEFAULT 'Available',
    DriveTrain VARCHAR(30) DEFAULT 'AWD',
    BatteryCapacity VARCHAR(50) NULL,
    ChargingType VARCHAR(50) NULL,
    RangePerCharge INT NULL,
    EngineSize VARCHAR(50) NULL,
    FuelConsumption VARCHAR(50) NULL,
    HybridMode VARCHAR(50) NULL,
    KeyFeatures TEXT NULL,
    RejectionReason TEXT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SellerId) REFERENCES Users(Id) ON DELETE RESTRICT
);

-- 3. Car Images Table
CREATE TABLE IF NOT EXISTS CarImages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    CarId INT NOT NULL,
    ImageUrl VARCHAR(500) NOT NULL,
    IsPrimary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (CarId) REFERENCES Cars(Id) ON DELETE CASCADE
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS Bookings (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    BuyerId INT NOT NULL,
    CarId INT NOT NULL,
    BookingDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ScheduledHandoverDate DATETIME NULL,
    ScheduledTimeSlot VARCHAR(50) DEFAULT '09:00 AM',
    BookingStatus VARCHAR(30) DEFAULT 'Pending',
    OfferAmount DECIMAL(12,2) NOT NULL,
    DeliveryLocation VARCHAR(200) DEFAULT 'KARAJAK Delivery Center - Amman',
    Notes TEXT NULL,
    FOREIGN KEY (BuyerId) REFERENCES Users(Id) ON DELETE RESTRICT,
    FOREIGN KEY (CarId) REFERENCES Cars(Id) ON DELETE RESTRICT
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS Payments (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    BookingId INT NOT NULL UNIQUE,
    Amount DECIMAL(12,2) NOT NULL,
    PaymentMethod VARCHAR(50) DEFAULT 'Credit Card',
    PaymentStatus VARCHAR(30) DEFAULT 'Successful',
    TransactionCode VARCHAR(50) NOT NULL,
    TransactionDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    ReceiptUrl VARCHAR(500) NULL,
    FOREIGN KEY (BookingId) REFERENCES Bookings(Id) ON DELETE CASCADE
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS Reviews (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    BuyerId INT NOT NULL,
    SellerId INT NOT NULL,
    CarId INT NULL,
    Rating TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BuyerId) REFERENCES Users(Id) ON DELETE RESTRICT,
    FOREIGN KEY (SellerId) REFERENCES Users(Id) ON DELETE RESTRICT,
    FOREIGN KEY (CarId) REFERENCES Cars(Id) ON DELETE SET NULL
);

-- 7. Chat Messages Table
CREATE TABLE IF NOT EXISTS ChatMessages (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    SenderId INT NOT NULL,
    ReceiverId INT NOT NULL,
    CarId INT NULL,
    Content TEXT NOT NULL,
    SentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    IsRead BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (SenderId) REFERENCES Users(Id) ON DELETE RESTRICT,
    FOREIGN KEY (ReceiverId) REFERENCES Users(Id) ON DELETE RESTRICT,
    FOREIGN KEY (CarId) REFERENCES Cars(Id) ON DELETE SET NULL
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    Title VARCHAR(150) NOT NULL,
    Content TEXT NOT NULL,
    Type VARCHAR(50) DEFAULT 'General',
    IsRead BOOLEAN DEFAULT FALSE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS Reports (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ReporterId INT NOT NULL,
    TargetType VARCHAR(30) DEFAULT 'Listing',
    TargetId INT NOT NULL,
    TargetTitle VARCHAR(100) NOT NULL,
    Reason TEXT NOT NULL,
    Priority VARCHAR(30) DEFAULT 'Standard',
    Status VARCHAR(30) DEFAULT 'Active',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ReporterId) REFERENCES Users(Id) ON DELETE RESTRICT
);
