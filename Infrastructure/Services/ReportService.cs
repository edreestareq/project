using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class ReportService : IReportService
    {
        private readonly KarajakDbContext _context;

        public ReportService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> CreateReportAsync(CreateReportDto dto, int reporterId)
        {
            var reporter = await _context.Users.FindAsync(reporterId);
            if (reporter == null) return ServiceResult.Unauthorized("Valid user account required.");
            if (reporter.Role == "Admin") return ServiceResult.Forbidden("Admins moderate reports and do not submit user reports.");

            if (string.IsNullOrWhiteSpace(dto.Reason))
                return ServiceResult.BadRequest("يرجى كتابة سبب البلاغ.");

            var targetType = dto.TargetType.Trim().Equals("User", StringComparison.OrdinalIgnoreCase) ? "User" : "Listing";
            string targetTitle;

            if (targetType == "Listing")
            {
                var car = await _context.Cars.FindAsync(dto.TargetId);
                if (car == null) return ServiceResult.NotFound("المركبة غير موجودة.");
                if (car.SellerId == reporterId) return ServiceResult.BadRequest("لا يمكنك الإبلاغ عن إعلانك الخاص.");
                targetTitle = $"Listing: {car.Year} {car.Brand} {car.Model}";
            }
            else
            {
                var targetUser = await _context.Users.FindAsync(dto.TargetId);
                if (targetUser == null) return ServiceResult.NotFound("المستخدم غير موجود.");
                if (targetUser.Id == reporterId) return ServiceResult.BadRequest("لا يمكنك الإبلاغ عن حسابك.");
                targetTitle = $"User: {targetUser.FullName}";
            }

            var duplicate = await _context.Reports.AnyAsync(r =>
                r.ReporterId == reporterId &&
                r.TargetType == targetType &&
                r.TargetId == dto.TargetId &&
                r.Status == "Active");

            if (duplicate)
                return ServiceResult.BadRequest("لقد قمت بإرسال بلاغ مسبقاً وهو قيد المراجعة حالياً.");

            var report = new Report
            {
                ReporterId = reporterId,
                TargetType = targetType,
                TargetId = dto.TargetId,
                TargetTitle = targetTitle,
                Reason = dto.Reason.Trim(),
                Priority = string.IsNullOrWhiteSpace(dto.Priority) ? "Standard" : dto.Priority.Trim(),
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reports.Add(report);
            _context.Notifications.Add(new Notification
            {
                UserId = 1,
                Title = "New Report Submitted",
                Content = $"{reporter.FullName} reported {targetTitle}.",
                Type = "General"
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Created(new { success = true, reportId = report.Id, message = "تم استلام بلاغك بنجاح وسيتم مراجعته من الإدارة." });
        }
    }
}
