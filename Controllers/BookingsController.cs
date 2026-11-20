using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingCreateDto dto, [FromQuery] int buyerId)
        {
            var res = await _bookingService.CreateBookingAsync(dto, buyerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyBookings([FromQuery] int buyerId)
        {
            var res = await _bookingService.GetMyBookingsAsync(buyerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("seller")]
        public async Task<IActionResult> GetSellerBookings([FromQuery] int sellerId)
        {
            var res = await _bookingService.GetSellerBookingsAsync(sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] BookingStatusUpdateDto dto)
        {
            var res = await _bookingService.UpdateBookingStatusAsync(id, dto);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            var res = await _bookingService.GetInvoiceAsync(id);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
