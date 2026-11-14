using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public NotificationsController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int userId)
        {
            var notifs = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .ToListAsync();

            var unreadCount = notifs.Count(n => !n.IsRead);

            return Ok(new
            {
                UnreadCount = unreadCount,
                Notifications = notifs
            });
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notif = await _context.Notifications.FindAsync(id);
            if (notif == null) return NotFound();

            notif.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllRead([FromQuery] int userId)
        {
            var notifs = await _context.Notifications.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
            foreach (var n in notifs) n.IsRead = true;
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
    }
}
