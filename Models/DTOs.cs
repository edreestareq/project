using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace AspnetStarterApp.Models
{
    public class RegisterDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string PhoneNumber { get; set; } = string.Empty;

        public string Role { get; set; } = "Buyer"; // Buyer, Seller
    }

    public class LoginDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AdminLoginDto
    {
        [Required]
        public string AdminIdOrEmail { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;

        public string? TwoFactorCode { get; set; }
    }

    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string TokenOrCode { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public UserDto? User { get; set; }
        public bool Requires2FA { get; set; } = false;
        public string? TempToken { get; set; }
    }

    public class UserDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsVerified { get; set; }
        public string? ProfilePicture { get; set; }
    }

    public class CarFilterDto
    {
        public string? SearchQuery { get; set; }
        public string? Brand { get; set; }
        public string? Model { get; set; }
        public int? MinYear { get; set; }
        public int? MaxYear { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int? MaxMileage { get; set; }
        public string? FuelType { get; set; }
        public string? Transmission { get; set; }
        public string? Location { get; set; }
        public string? SortBy { get; set; } // "price_asc", "price_desc", "year_desc", "mileage_asc", "newest"
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 12;
    }

    public class CarUpsertDto
    {
        [Required]
        public string Brand { get; set; } = string.Empty;

        [Required]
        public string Model { get; set; } = string.Empty;

        [Required]
        public int Year { get; set; }

        [Required]
        public decimal Price { get; set; }

        public int Mileage { get; set; }
        public string FuelType { get; set; } = "Petrol";
        public string Transmission { get; set; } = "Automatic";
        public string Color { get; set; } = "Black";
        public string Location { get; set; } = "Amman, Jordan";
        public string Description { get; set; } = string.Empty;
        public string? DriveTrain { get; set; } = "AWD";
        public string? BatteryCapacity { get; set; }
        public string? ChargingType { get; set; }
        public int? RangePerCharge { get; set; }
        public string? EngineSize { get; set; }
        public string? FuelConsumption { get; set; }
        public string? HybridMode { get; set; }
        public List<string> Images { get; set; } = new();
        public List<string> KeyFeatures { get; set; } = new();
    }

    public class AiSearchRequestDto
    {
        [Required]
        public string Query { get; set; } = string.Empty;
    }

    public class AiSearchResponseDto
    {
        public string NaturalQuery { get; set; } = string.Empty;
        public string ParsedIntent { get; set; } = string.Empty;
        public string AiAnalysisComment { get; set; } = string.Empty;
        public List<CarWithAiScoreDto> Results { get; set; } = new();
    }

    public class CarWithAiScoreDto
    {
        public Car Car { get; set; } = null!;
        public int MatchPercentage { get; set; }
        public string MatchReason { get; set; } = string.Empty;
        public decimal EstimatedMarketValue { get; set; }
        public double ReliabilityScore { get; set; }
        public string DemandLevel { get; set; } = "High";
    }

    public class BookingCreateDto
    {
        [Required]
        public int CarId { get; set; }
        public DateTime ScheduledHandoverDate { get; set; }
        public string ScheduledTimeSlot { get; set; } = "09:00 AM";
        public string DeliveryLocation { get; set; } = "KARAJAK Delivery Center";
        public decimal OfferAmount { get; set; }
        public string? Notes { get; set; }
        public string PaymentMethod { get; set; } = "Credit Card";
    }

    public class CheckoutDto
    {
        [Required]
        public int BookingId { get; set; }
        public string PaymentMethod { get; set; } = "Credit Card";
        public string? CardholderName { get; set; }
        public string? CardNumber { get; set; }
        public string? ExpiryDate { get; set; }
        public string? Cvv { get; set; }
    }

    public class SendMessageDto
    {
        [Required]
        public int ReceiverId { get; set; }
        public int? CarId { get; set; }
        [Required]
        public string Content { get; set; } = string.Empty;
    }

    public class SubmitReviewDto
    {
        [Required]
        public int SellerId { get; set; }
        public int? CarId { get; set; }
        [Range(1, 5)]
        public int Rating { get; set; }
        [Required]
        public string Comment { get; set; } = string.Empty;
    }

    public class AdminStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveListings { get; set; }
        public decimal TotalRevenue { get; set; }
        public int PendingReports { get; set; }
        public int PendingListingApprovals { get; set; }
        public double SuccessRate { get; set; }
        public int PendingClearances { get; set; }
        public List<RecentActivityItemDto> RecentActivity { get; set; } = new();
    }

    public class RecentActivityItemDto
    {
        public string Title { get; set; } = string.Empty;
        public string Detail { get; set; } = string.Empty;
        public string TimeAgo { get; set; } = string.Empty;
        public string Type { get; set; } = "info"; // info, alert, success
    }
}
