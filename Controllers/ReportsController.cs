using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto dto, [FromQuery] int reporterId)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var res = await _reportService.CreateReportAsync(dto, reporterId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
