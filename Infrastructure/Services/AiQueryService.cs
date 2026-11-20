using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class AiQueryService : IAiQueryService
    {
        private readonly KarajakDbContext _context;
        private readonly IAiService _aiService;

        public AiQueryService(KarajakDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<ServiceResult> SearchAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return ServiceResult.BadRequest("Search query is required.");

            var availableCars = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Where(c => c.Status == "Available" || c.Status == "Reserved")
                .ToListAsync();

            var result = await _aiService.SearchWithAiAsync(query, availableCars);
            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetRecommendationsAsync(int? userId)
        {
            var availableCars = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Where(c => c.Status == "Available")
                .ToListAsync();

            var result = await _aiService.GetRecommendationsAsync(userId, availableCars);
            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetCarInsightsAsync(int carId)
        {
            var car = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null) return ServiceResult.NotFound("Vehicle not found.");

            var insights = await _aiService.GetCarInsightsAsync(car);
            return ServiceResult.Ok(insights);
        }

        public async Task<ServiceResult> AskAssistantAsync(string message, string? context)
        {
            if (string.IsNullOrWhiteSpace(message))
                return ServiceResult.BadRequest("Message is required.");

            var reply = await _aiService.AskAssistantAsync(message, context);
            return ServiceResult.Ok(new { reply });
        }

        public async Task<ServiceResult> GetSellerInsightsAsync(int sellerId)
        {
            var listings = await _context.Cars
                .Where(c => c.SellerId == sellerId)
                .ToListAsync();

            var insights = await _aiService.GenerateSellerInsightsAsync(listings);
            return ServiceResult.Ok(new { insights });
        }
    }
}
