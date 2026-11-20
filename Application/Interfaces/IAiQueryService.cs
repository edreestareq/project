using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IAiQueryService
    {
        Task<ServiceResult> SearchAsync(string query);
        Task<ServiceResult> GetRecommendationsAsync(int? userId);
        Task<ServiceResult> GetCarInsightsAsync(int carId);
        Task<ServiceResult> AskAssistantAsync(string message, string? context);
        Task<ServiceResult> GetSellerInsightsAsync(int sellerId);
    }
}
