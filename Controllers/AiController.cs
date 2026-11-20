using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiQueryService _aiQueryService;

        public AiController(IAiQueryService aiQueryService)
        {
            _aiQueryService = aiQueryService;
        }

        [HttpPost("search")]
        public async Task<IActionResult> NaturalLanguageSearch([FromBody] AiSearchRequestDto request)
        {
            var res = await _aiQueryService.SearchAsync(request.Query);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("recommendations")]
        public async Task<IActionResult> GetRecommendations([FromQuery] int? userId)
        {
            var res = await _aiQueryService.GetRecommendationsAsync(userId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("insights/{carId}")]
        public async Task<IActionResult> GetCarInsights(int carId)
        {
            var res = await _aiQueryService.GetCarInsightsAsync(carId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost("assistant")]
        public async Task<IActionResult> AskAssistant([FromBody] AssistantMessageRequest request)
        {
            var res = await _aiQueryService.AskAssistantAsync(request.Message, request.Context);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("seller-insights")]
        public async Task<IActionResult> GetSellerInsights([FromQuery] int sellerId)
        {
            var res = await _aiQueryService.GetSellerInsightsAsync(sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }

    public class AssistantMessageRequest
    {
        public string Message { get; set; } = string.Empty;
        public string? Context { get; set; }
    }
}
