using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;
using AspnetStarterApp.Services;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly KarajakDbContext _context;
        private readonly IAiService _aiService;

        public AiController(KarajakDbContext context, IAiService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        [HttpPost("search")]
        public async Task<IActionResult> NaturalLanguageSearch([FromBody] AiSearchRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Query))
            {
                return BadRequest(new { message = "Search query is required." });
            }

            var availableCars = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Where(c => c.Status == "Available" || c.Status == "Reserved")
                .ToListAsync();

            var result = await _aiService.SearchWithAiAsync(request.Query, availableCars);
            return Ok(result);
        }

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int? userId)
        {
            var availableCars = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Where(c => c.Status == "Available")
                .ToListAsync();

            var result = await _aiService.GetRecommendationsAsync(userId, availableCars);
            return Ok(result);
        }

        [HttpGet("insights/{carId}")]
        public async Task<IActionResult> GetCarInsights(int carId)
        {
            var car = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null) return NotFound(new { message = "Vehicle not found." });

            var insights = await _aiService.GetCarInsightsAsync(car);
            return Ok(insights);
        }

        [HttpPost("assistant")]
        public async Task<IActionResult> AskAssistant([FromBody] AssistantMessageRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            var reply = await _aiService.AskAssistantAsync(request.Message, request.Context);
            return Ok(new { reply });
        }

        [HttpGet("seller-insights")]
        public async Task<IActionResult> GetSellerInsights([FromQuery] int sellerId)
        {
            var listings = await _context.Cars
                .Where(c => c.SellerId == sellerId)
                .ToListAsync();

            var insights = await _aiService.GenerateSellerInsightsAsync(listings);
            return Ok(new { insights });
        }
    }

    public class AssistantMessageRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? Context { get; set; }
    }
}
