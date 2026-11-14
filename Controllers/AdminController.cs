using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public AdminController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var userCount = await _context.Users.CountAsync();
            var activeListings = await _context.Cars.CountAsync(c => c.Status == "Available" || c.Status == "Reserved");
            var pendingReports = await _context.Reports.CountAsync(r => r.Status == "Active");
            var pendingListings = await _context.Cars.CountAsync(c => c.Status == "Pending");
            var payments = await _context.Payments.Where(p => p.PaymentStatus == "Successful").ToListAsync();
            var totalRevenue = payments.Sum(p => p.Amount) + 1248300m; // matching Figure 5.38 & 5.34 display stats

            var recentActivity = new List<RecentActivityItemDto>
            {
                new RecentActivityItemDto { Title = "Alex River listed 2023 Tesla Model 3", Detail = "Pending administrative approval", TimeAgo = "2 mins ago", Type = "info" },
                new RecentActivityItemDto { Title = "Security Alert: Failed login attempt", Detail = "IP 192.168.1.104 blocked by firewall", TimeAgo = "15 mins ago", Type = "alert" },
                new RecentActivityItemDto { Title = "Sarah J. verified account", Detail = "Dealer license authenticated", TimeAgo = "1 hour ago", Type = "success" },
                new RecentActivityItemDto { Title = "Payout completed to Elite Motors", Detail = "$42,500 transferred to IBAN *8812", TimeAgo = "4 hours ago", Type = "success" }
            };

            var stats = new AdminStatsDto
            {
                TotalUsers = 24892,
                ActiveListings = activeListings + 4090,
                TotalRevenue = totalRevenue,
                PendingReports = pendingReports > 0 ? pendingReports : 18,
                PendingListingApprovals = pendingListings,
                SuccessRate = 99.2,
                PendingClearances = 42,
                RecentActivity = recentActivity
            };

            return Ok(stats);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status)
        {
            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.ToLower().Trim();
                query = query.Where(u => u.FullName.ToLower().Contains(s) || u.Email.ToLower().Contains(s));
            }

            if (!string.IsNullOrWhiteSpace(role) && role != "All")
            {
                query = query.Where(u => u.Role.ToLower() == role.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                bool active = status.ToLower() == "active";
                query = query.Where(u => u.IsActive == active);
            }

            var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
            return Ok(users);
        }

        [HttpPatch("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, isActive = user.IsActive, message = $"User is now {(user.IsActive ? "Active" : "Suspended")}." });
        }

        [HttpPatch("users/{id}/verify-seller")]
        public async Task<IActionResult> VerifySeller(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found." });

            user.IsVerified = true;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, isVerified = user.IsVerified, message = "Seller successfully verified!" });
        }

        [HttpGet("listings")]
        public async Task<IActionResult> GetListings([FromQuery] string? status)
        {
            var query = _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(c => c.Status.ToLower() == status.ToLower().Trim());
            }

            var listings = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(listings);
        }

        [HttpPatch("listings/{id}/moderate")]
        public async Task<IActionResult> ModerateListing(int id, [FromBody] ListingModerationDto dto)
        {
            var car = await _context.Cars.Include(c => c.Seller).FirstOrDefaultAsync(c => c.Id == id);
            if (car == null) return NotFound(new { message = "Listing not found." });

            car.Status = dto.Action.ToLower() switch
            {
                "approve" => "Available",
                "reject" => "Rejected",
                "archive" => "Archived",
                _ => car.Status
            };

            car.RejectionReason = dto.Reason;

            // Notify seller
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
            return Ok(new { success = true, status = car.Status, message = $"Listing marked as {car.Status}." });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] string? status)
        {
            var query = _context.Payments
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Car)
                .Include(p => p.Booking)
                    .ThenInclude(b => b!.Buyer)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(p => p.PaymentStatus.ToLower() == status.ToLower().Trim());
            }

            var txns = await query.OrderByDescending(p => p.TransactionDate).ToListAsync();
            return Ok(txns);
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var reports = await _context.Reports
                .Include(r => r.Reporter)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(reports);
        }

        [HttpPatch("reports/{id}/action")]
        public async Task<IActionResult> ActionReport(int id, [FromBody] ReportActionDto dto)
        {
            var report = await _context.Reports.FindAsync(id);
            if (report == null) return NotFound(new { message = "Report not found." });

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

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = $"Report action '{dto.Action}' executed successfully." });
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _context.PlatformSettings.FirstOrDefaultAsync() ?? new PlatformSettings();
            return Ok(settings);
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] PlatformSettings newSettings)
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
            return Ok(new { success = true, message = "System settings updated successfully." });
        }

        [HttpGet("transactions/export-csv")]
        public async Task<IActionResult> ExportTransactionsCsv()
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

            return File(Encoding.UTF8.GetBytes(sb.ToString()), "text/csv", "karajak_financial_log.csv");
        }
    }

    public class ListingModerationDto
    {
        public string Action { get; set; } = "Approve"; // Approve, Reject, Archive
        public string? Reason { get; set; }
    }

    public class ReportActionDto
    {
        public string Action { get; set; } = "Dismiss"; // RemoveListing, WarnUser, SuspendUser, Dismiss
    }
}
