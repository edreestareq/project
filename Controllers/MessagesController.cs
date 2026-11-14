using System;
using System.Collections.Generic;
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
    public class MessagesController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public MessagesController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations([FromQuery] int userId)
        {
            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Car)
                    .ThenInclude(c => c!.Images)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

            // Group by the other participant
            var groups = messages
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g =>
                {
                    var lastMsg = g.First();
                    var otherUser = lastMsg.SenderId == userId ? lastMsg.Receiver! : lastMsg.Sender!;
                    var unreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead);
                    return new
                    {
                        OtherUserId = otherUser.Id,
                        OtherUserName = otherUser.FullName,
                        OtherUserRole = otherUser.Role,
                        OtherUserAvatar = otherUser.ProfilePicture,
                        IsVerified = otherUser.IsVerified,
                        LastMessage = lastMsg.Content,
                        LastMessageTime = lastMsg.SentAt,
                        Car = lastMsg.Car,
                        UnreadCount = unreadCount
                    };
                })
                .ToList();

            return Ok(groups);
        }

        [HttpGet("thread")]
        public async Task<IActionResult> GetThread([FromQuery] int userId, [FromQuery] int otherUserId, [FromQuery] int? carId)
        {
            var thread = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Car)
                .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == userId))
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            // Mark received as read
            var unread = thread.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
            if (unread.Any())
            {
                unread.ForEach(m => m.IsRead = true);
                await _context.SaveChangesAsync();
            }

            Car? carContext = null;
            if (carId.HasValue)
            {
                carContext = await _context.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == carId.Value);
            }
            else if (thread.Any(m => m.Car != null))
            {
                carContext = thread.Last(m => m.Car != null).Car;
            }

            return Ok(new
            {
                Messages = thread,
                CarContext = carContext
            });
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto, [FromQuery] int senderId)
        {
            var sender = await _context.Users.FindAsync(senderId);
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);

            if (sender == null || receiver == null)
            {
                return BadRequest(new { message = "Invalid sender or receiver." });
            }

            var message = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = dto.ReceiverId,
                CarId = dto.CarId,
                Content = dto.Content.Trim(),
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.ChatMessages.Add(message);

            // Notification
            _context.Notifications.Add(new Notification
            {
                UserId = dto.ReceiverId,
                Title = $"New message from {sender.FullName}",
                Content = dto.Content.Length > 80 ? dto.Content[..77] + "..." : dto.Content,
                Type = "Message"
            });

            await _context.SaveChangesAsync();
            return Ok(message);
        }
    }
}
