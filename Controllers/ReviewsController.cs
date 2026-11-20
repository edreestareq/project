using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDto dto, [FromQuery] int buyerId)
        {
            var res = await _reviewService.SubmitReviewAsync(dto, buyerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("seller/{sellerId}")]
        public async Task<IActionResult> GetSellerReviews(int sellerId)
        {
            var res = await _reviewService.GetSellerReviewsAsync(sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
