using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class MessageService : IMessageService
    {
        private readonly KarajakDbContext _context;

        public MessageService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetConversationsAsync(int userId)
        {
            var messages = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Car).ThenInclude(c => c!.Images)
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.SentAt)
                .ToListAsync();

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

            return ServiceResult.Ok(groups);
        }

        public async Task<ServiceResult> GetThreadAsync(int userId, int otherUserId, int? carId)
        {
            var thread = await _context.ChatMessages
                .Include(m => m.Sender)
                .Include(m => m.Receiver)
                .Include(m => m.Car)
                .Where(m => (m.SenderId == userId && m.ReceiverId == otherUserId) ||
                            (m.SenderId == otherUserId && m.ReceiverId == userId))
                .OrderBy(m => m.SentAt)
                .ToListAsync();

            var unread = thread.Where(m => m.ReceiverId == userId && !m.IsRead).ToList();
            if (unread.Any())
            {
                unread.ForEach(m => m.IsRead = true);
                await _context.SaveChangesAsync();
            }

            Car? carContext = null;
            if (carId.HasValue)
                carContext = await _context.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == carId.Value);
            else if (thread.Any(m => m.Car != null))
                carContext = thread.Last(m => m.Car != null).Car;

            var otherUser = await _context.Users
                .Where(u => u.Id == otherUserId)
                .Select(u => new { u.Id, u.FullName, u.Role, u.ProfilePicture, u.IsVerified })
                .FirstOrDefaultAsync();

            return ServiceResult.Ok(new
            {
                Messages = thread,
                CarContext = carContext,
                OtherUser = otherUser
            });
        }

        public async Task<ServiceResult> SendMessageAsync(SendMessageDto dto, int senderId)
        {
            if (senderId == dto.ReceiverId)
                return ServiceResult.BadRequest("لا يمكنك مراسلة نفسك.");

            var sender = await _context.Users.FindAsync(senderId);
            var receiver = await _context.Users.FindAsync(dto.ReceiverId);

            if (sender == null || receiver == null)
                return ServiceResult.BadRequest("Invalid sender or receiver.");

            if (sender.Role == "Admin" || receiver.Role == "Admin")
                return ServiceResult.Forbidden("Direct buyer-seller messaging is only available for Buyers and Sellers.");

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
            _context.Notifications.Add(new Notification
            {
                UserId = dto.ReceiverId,
                Title = $"New message from {sender.FullName}",
                Content = dto.Content.Length > 80 ? dto.Content[..77] + "..." : dto.Content,
                Type = "Message"
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(message);
        }
    }
}
