using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class AdminService : IAdminService
    {
        private readonly KarajakDbContext _context;

        public AdminService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetDashboardStatsAsync()
        {
            var userCount = await _context.Users.CountAsync();
            var activeListings = await _context.Cars.CountAsync(c => c.Status == "Available" || c.Status == "Reserved");
            var pendingReports = await _context.Reports.CountAsync(r => r.Status == "Active");
            var pendingListings = await _context.Cars.CountAsync(c => c.Status == "Pending");
            var pendingClearances = await _context.Bookings.CountAsync(b => b.BookingStatus == "Pending" || b.BookingStatus == "Approved");
            var totalPaymentsCount = await _context.Payments.CountAsync();
            var successfulPayments = await _context.Payments.Where(p => p.PaymentStatus == "Successful").ToListAsync();
            var totalRevenue = successfulPayments.Sum(p => p.Amount);
            var successRate = totalPaymentsCount > 0 ? Math.Round((double)successfulPayments.Count / totalPaymentsCount * 100, 1) : 100.0;

            var logs = await _context.AdminLogs
                .OrderByDescending(l => l.ActionDate)
                .Take(5)
                .ToListAsync();

            var recentActivity = logs.Select(l => new RecentActivityItemDto
            {
                Title = $"{l.ActionType}: {l.TargetEntity}",
                Detail = l.Details,
                TimeAgo = l.ActionDate.ToString("yyyy-MM-dd HH:mm"),
                Type = "info"
            }).ToList();

            var stats = new AdminStatsDto
            {
                TotalUsers = userCount,
                ActiveListings = activeListings,
                TotalRevenue = totalRevenue,
                PendingReports = pendingReports,
                PendingListingApprovals = pendingListings,
                SuccessRate = successRate,
                PendingClearances = pendingClearances,
                RecentActivity = recentActivity
            };

            return ServiceResult.Ok(stats);
        }

        public async Task<ServiceResult> GetUsersAsync(string? search, string? role, string? status)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower().Trim();
                query = query.Where(u => u.FullName.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(role) && role != "All")
                query = query.Where(u => u.Role.ToLower() == role.ToLower());

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                bool active = status.ToLower() == "active";
                query = query.Where(u => u.IsActive == active);
            }

            var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
            return ServiceResult.Ok(users);
        }

        public async Task<ServiceResult> ToggleUserStatusAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return ServiceResult.NotFound("User not found.");

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new { success = true, isActive = user.IsActive, message = $"User is now {(user.IsActive ? "Active" : "Suspended")}." });
        }

        public async Task<ServiceResult> VerifySellerAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return ServiceResult.NotFound("User not found.");

            user.IsVerified = true;
            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new { success = true, isVerified = user.IsVerified, message = "Seller successfully verified!" });
        }

        public async Task<ServiceResult> GetListingsAsync(string? status)
        {
            var query = _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
                query = query.Where(c => c.Status.ToLower() == status.ToLower().Trim());

            var listings = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
            return ServiceResult.Ok(listings);
        }

        public async Task<ServiceResult> ModerateListingAsync(int id, ListingModerationDto dto)
        {
            var car = await _context.Cars.Include(c => c.Seller).FirstOrDefaultAsync(c => c.Id == id);
            if (car == null) return ServiceResult.NotFound("Listing not found.");

            car.Status = dto.Action.ToLower() switch
            {
                "approve" => "Available",
                "reject" => "Rejected",
                "archive" => "Archived",
                _ => car.Status
            };

            car.RejectionReason = dto.Reason;

            _context.Notifications.Add(new Notification
            {
                UserId = car.SellerId,
                Title = dto.Action.ToLower() == "approve" ? "Listing Approved!" : "Listing Update Required",
                Content = dto.Action.ToLower() == "approve"
                    ? $"Your listing for {car.Year} {car.Brand} {car.Model} is now live on the marketplace."
                    : $"Your listing was rejected: {dto.Reason ?? "Policy violation."}",
                Type = "Listing"
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true, status = car.Status, message = $"Listing marked as {car.Status}." });
        }

        public async Task<ServiceResult> GetTransactionsAsync(string? status)
        {
            var query = _context.Payments
                .Include(p => p.Booking).ThenInclude(b => b!.Car)
                .Include(p => p.Booking).ThenInclude(b => b!.Buyer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
                query = query.Where(p => p.PaymentStatus.ToLower() == status.ToLower().Trim());

            var txns = await query.OrderByDescending(p => p.TransactionDate).ToListAsync();
            return ServiceResult.Ok(txns);
        }

        public async Task<ServiceResult> GetReportsAsync()
        {
            var reports = await _context.Reports
                .Include(r => r.Reporter)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return ServiceResult.Ok(reports);
        }

        public async Task<ServiceResult> ActionReportAsync(int id, ReportActionDto dto)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null) return ServiceResult.NotFound("Report not found.");

            report.Status = dto.Action.ToLower() == "dismiss" ? "Dismissed" : "Resolved";

            if (dto.Action.ToLower() == "removelisting" && report.TargetType == "Listing")
            {
                var car = await _context.Cars.FindAsync(report.TargetId);
                if (car != null) car.Status = "Rejected";
            }
            else if (dto.Action.ToLower() == "suspenduser" && report.TargetType == "User")
            {
                var user = await _context.Users.FindAsync(report.TargetId);
                if (user != null) user.IsActive = false;
            }

            _context.AdminLogs.Add(new AdminLog
            {
                AdminId = 1,
                ActionType = $"Report {dto.Action}",
                TargetEntity = report.TargetTitle,
                Details = string.IsNullOrWhiteSpace(dto.Note) ? report.Reason : dto.Note,
                ActionDate = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true, message = $"Report action '{dto.Action}' executed successfully." });
        }

        public async Task<ServiceResult> GetSettingsAsync()
        {
            var settings = await _context.PlatformSettings.FirstOrDefaultAsync() ?? new PlatformSettings();
            return ServiceResult.Ok(settings);
        }

        public async Task<ServiceResult> UpdateSettingsAsync(PlatformSettings newSettings)
        {
            var settings = await _context.PlatformSettings.FirstOrDefaultAsync();
            if (settings == null)
            {
                _context.PlatformSettings.Add(newSettings);
            }
            else
            {
                settings.PlatformName = newSettings.PlatformName;
                settings.SupportEmail = newSettings.SupportEmail;
                settings.BaseCurrency = newSettings.BaseCurrency;
                settings.MaintenanceMode = newSettings.MaintenanceMode;
                settings.AiValuationEngine = newSettings.AiValuationEngine;
                settings.GlobalDarkMode = newSettings.GlobalDarkMode;
            }

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true, message = "System settings updated successfully." });
        }

        public async Task<byte[]> ExportTransactionsCsvAsync()
        {
            var payments = await _context.Payments
                .Include(p => p.Booking).ThenInclude(b => b!.Car)
                .Include(p => p.Booking).ThenInclude(b => b!.Buyer)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("TransactionID,Date,Vehicle,Buyer,Amount,Status,PaymentMethod");

            foreach (var p in payments)
            {
                var carTitle = p.Booking?.Car != null ? $"{p.Booking.Car.Year} {p.Booking.Car.Brand} {p.Booking.Car.Model}" : "N/A";
                var buyerName = p.Booking?.Buyer?.FullName ?? "N/A";
                sb.AppendLine($"{p.TransactionCode},{p.TransactionDate:yyyy-MM-dd HH:mm},{carTitle},{buyerName},{p.Amount},{p.PaymentStatus},{p.PaymentMethod}");
            }

            return Encoding.UTF8.GetBytes(sb.ToString());
        }
    }
}
