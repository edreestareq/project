using System.Collections.Generic;
using System.Threading.Tasks;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Services
{
    public interface IAiService
    {
        Task<AiSearchResponseDto> SearchWithAiAsync(string naturalLanguageQuery, List<Car> availableCars);
        Task<List<CarWithAiScoreDto>> GetRecommendationsAsync(int? userId, List<Car> availableCars);
        Task<CarWithAiScoreDto> GetCarInsightsAsync(Car car);
        Task<string> AskAssistantAsync(string message, string? currentContext);
        Task<string> GenerateSellerInsightsAsync(List<Car> sellerListings);
    }
}
