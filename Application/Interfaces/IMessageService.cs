using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IMessageService
    {
        Task<ServiceResult> GetConversationsAsync(int userId);
        Task<ServiceResult> GetThreadAsync(int userId, int otherUserId, int? carId);
        Task<ServiceResult> SendMessageAsync(SendMessageDto dto, int senderId);
    }
}
