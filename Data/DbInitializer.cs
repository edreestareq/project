using System;
using System.Security.Cryptography;
using System.Text;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Data
{
    public static class DbInitializer
    {
        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "KARAJAK_SALT_2026"));
            return Convert.ToBase64String(bytes);
        }

        public static void Initialize(KarajakDbContext context)
        {
            context.Database.EnsureCreated();

            if (context.Users.Any())
            {
                return; // Database already initialized
            }

            // 1. Essential System Accounts (Zero fake listings, zero fake transactions)
            var admin = new User
            {
                FullName = "مسؤول النظام الرئيسي (System Administrator)",
                Email = "admin@karajak.ai",
                PasswordHash = HashPassword("Admin123!"),
                PhoneNumber = "+962 79 000 0001",
                Role = "Admin",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow
            };

            var testSeller = new User
            {
                FullName = "معرض الكراج الذكي",
                Email = "seller@karajak.ai",
                PasswordHash = HashPassword("Seller123!"),
                PhoneNumber = "+962 79 123 4567",
                Role = "Seller",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                VerificationDocument = "DEALER_LICENSE_OFFICIAL.pdf",
                CreatedAt = DateTime.UtcNow
            };

            var testBuyer = new User
            {
                FullName = "علي حسن (مشتري)",
                Email = "buyer@karajak.ai",
                PasswordHash = HashPassword("Buyer123!"),
                PhoneNumber = "+962 79 987 6543",
                Role = "Buyer",
                IsActive = true,
                IsVerified = true,
                ProfilePicture = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(admin, testSeller, testBuyer);

            // 2. Platform Core Settings
            context.PlatformSettings.Add(new PlatformSettings
            {
                PlatformName = "KARAJAK AI",
                SupportEmail = "support@karajak.ai",
                BaseCurrency = "USD ($)",
                MaintenanceMode = false,
                AiValuationEngine = true,
                GlobalDarkMode = true,
                GeminiModel = "gemini-1.5-flash"
            });

            // Save clean state - NO fake cars, NO fake bookings, NO fake reports, NO fake payments
            context.SaveChanges();
        }
    }
}
