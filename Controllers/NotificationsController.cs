using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] int userId)
        {
            var res = await _notificationService.GetNotificationsAsync(userId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var res = await _notificationService.MarkAsReadAsync(id);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllRead([FromQuery] int userId)
        {
            var res = await _notificationService.MarkAllReadAsync(userId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
