using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface INotificationService
    {
        Task<ServiceResult> GetNotificationsAsync(int userId);
        Task<ServiceResult> MarkAsReadAsync(int id);
        Task<ServiceResult> MarkAllReadAsync(int userId);
    }
}
