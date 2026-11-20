using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            var res = await _paymentService.CheckoutAsync(dto);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
