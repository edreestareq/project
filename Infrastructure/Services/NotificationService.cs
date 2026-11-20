using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly KarajakDbContext _context;

        public NotificationService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetNotificationsAsync(int userId)
        {
            var notifs = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync();

            return ServiceResult.Ok(new
            {
                UnreadCount = notifs.Count(n => !n.IsRead),
                Notifications = notifs
            });
        }

        public async Task<ServiceResult> MarkAsReadAsync(int id)
        {
            var notif = await _context.Notifications.FindAsync(id);
            if (notif == null) return ServiceResult.NotFound("Notification not found.");

            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true });
        }

        public async Task<ServiceResult> MarkAllReadAsync(int userId)
        {
            var notifs = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            foreach (var n in notifs) n.IsRead = true;
            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true });
        }
    }
}
