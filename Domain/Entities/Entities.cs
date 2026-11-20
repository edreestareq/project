using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AspnetStarterApp.Domain.Entities
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Role { get; set; } = "Buyer"; // "Buyer", "Seller", "Admin"

        public bool IsActive { get; set; } = true;

        public bool IsVerified { get; set; } = false;

        [MaxLength(255)]
        public string? ProfilePicture { get; set; }

        public string? VerificationDocument { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public List<Car> Listings { get; set; } = new();

        [JsonIgnore]
        public List<Booking> Bookings { get; set; } = new();

        [JsonIgnore]
        public List<Review> GivenReviews { get; set; } = new();

        [JsonIgnore]
        public List<Review> ReceivedReviews { get; set; } = new();
    }

    public class Car
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SellerId { get; set; }
        public User? Seller { get; set; }

        [Required]
        [MaxLength(50)]
        public string Brand { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Model { get; set; } = string.Empty;

        public int Year { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal Price { get; set; }

        public int Mileage { get; set; }

        [MaxLength(30)]
        public string FuelType { get; set; } = "Petrol"; // Petrol, Electric, Hybrid, Diesel

        [MaxLength(30)]
        public string Transmission { get; set; } = "Automatic"; // Automatic, Manual

        [MaxLength(30)]
        public string Color { get; set; } = "Black";

        [MaxLength(100)]
        public string Location { get; set; } = "Amman, Jordan";

        public string Description { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Status { get; set; } = "Available"; // Available, Pending, Reserved, Sold, Rejected, Archived

        [MaxLength(30)]
        public string? DriveTrain { get; set; } = "AWD"; // AWD, FWD, RWD

        public string? BatteryCapacity { get; set; }
        public string? ChargingType { get; set; }
        public int? RangePerCharge { get; set; }
        public string? EngineSize { get; set; }
        public string? FuelConsumption { get; set; }
        public string? HybridMode { get; set; }
        public string? KeyFeatures { get; set; } // Comma-separated or JSON list

        public string? RejectionReason { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<CarImage> Images { get; set; } = new();
        public List<Review> Reviews { get; set; } = new();
    }

    public class CarImage
    {
        [Key]
        public int Id { get; set; }

        public int CarId { get; set; }

        [Required]
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        public bool IsPrimary { get; set; } = false;
    }

    public class Booking
    {
        [Key]
        public int Id { get; set; }

        public int BuyerId { get; set; }
        public User? Buyer { get; set; }

        public int CarId { get; set; }
        public Car? Car { get; set; }

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        public DateTime? ScheduledHandoverDate { get; set; }

        [MaxLength(50)]
        public string? ScheduledTimeSlot { get; set; } // e.g., "09:00 AM", "01:30 PM", "04:00 PM"

        [MaxLength(30)]
        public string BookingStatus { get; set; } = "Pending"; // Pending, Approved, Payment Pending, Paid, Completed, Cancelled

        [Column(TypeName = "decimal(12,2)")]
        public decimal OfferAmount { get; set; }

        [MaxLength(200)]
        public string? DeliveryLocation { get; set; } = "KARAJAK Delivery Center - Amman";

        public string? Notes { get; set; }

        public Payment? Payment { get; set; }
    }

    public class Payment
    {
        [Key]
        public int Id { get; set; }

        public int BookingId { get; set; }
        [JsonIgnore]
        public Booking? Booking { get; set; }

        [Column(TypeName = "decimal(12,2)")]
        public decimal Amount { get; set; }

        [MaxLength(50)]
        public string PaymentMethod { get; set; } = "Credit Card"; // Card, Apple Pay, Google Wallet, Cash

        [MaxLength(30)]
        public string PaymentStatus { get; set; } = "Successful"; // Successful, Pending, Failed, Refunded

        [MaxLength(50)]
        public string TransactionCode { get; set; } = string.Empty; // e.g. "TXN-887654321"

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? ReceiptUrl { get; set; }
    }

    public class Review
    {
        [Key]
        public int Id { get; set; }

        public int BuyerId { get; set; }
        public User? Buyer { get; set; }

        public int SellerId { get; set; }
        [JsonIgnore]
        public User? Seller { get; set; }

        public int? CarId { get; set; }
        [JsonIgnore]
        public Car? Car { get; set; }

        [Range(1, 5)]
        public int Rating { get; set; } = 5;

        public string Comment { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class ChatMessage
    {
        [Key]
        public int Id { get; set; }

        public int SenderId { get; set; }
        public User? Sender { get; set; }

        public int ReceiverId { get; set; }
        public User? Receiver { get; set; }

        public int? CarId { get; set; }
        public Car? Car { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;
    }

    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }
        [JsonIgnore]
        public User? User { get; set; }

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Content { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Type { get; set; } = "General"; // Booking, Message, Listing, Security, System

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class Report
    {
        [Key]
        public int Id { get; set; }

        public int ReporterId { get; set; }
        public User? Reporter { get; set; }

        [MaxLength(30)]
        public string TargetType { get; set; } = "Listing"; // Listing, User

        public int TargetId { get; set; }

        [MaxLength(100)]
        public string TargetTitle { get; set; } = string.Empty;

        public string Reason { get; set; } = string.Empty;

        [MaxLength(30)]
        public string Priority { get; set; } = "Standard"; // High Priority, Standard, Urgent

        [MaxLength(30)]
        public string Status { get; set; } = "Active"; // Active, Resolved, Dismissed

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class AdminLog
    {
        [Key]
        public int Id { get; set; }

        public int AdminId { get; set; }
        public User? Admin { get; set; }

        [MaxLength(100)]
        public string ActionType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string TargetEntity { get; set; } = string.Empty;

        public string Details { get; set; } = string.Empty;

        public DateTime ActionDate { get; set; } = DateTime.UtcNow;
    }

    public class PlatformSettings
    {
        [Key]
        public int Id { get; set; } = 1;
        public string PlatformName { get; set; } = "KARAJAK AI";
        public string SupportEmail { get; set; } = "support@karajak.ai";
        public string BaseCurrency { get; set; } = "USD ($)";
        public bool MaintenanceMode { get; set; } = false;
        public bool AiValuationEngine { get; set; } = true;
        public bool GlobalDarkMode { get; set; } = true;
        public string GeminiModel { get; set; } = "gemini-1.5-flash";
    }
}
