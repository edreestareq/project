using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var res = await _adminService.GetDashboardStatsAsync();
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] string? role, [FromQuery] string? status)
        {
            var res = await _adminService.GetUsersAsync(search, role, status);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var res = await _adminService.ToggleUserStatusAsync(id);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("users/{id}/verify-seller")]
        public async Task<IActionResult> VerifySeller(int id)
        {
            var res = await _adminService.VerifySellerAsync(id);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("listings")]
        public async Task<IActionResult> GetListings([FromQuery] string? status)
        {
            var res = await _adminService.GetListingsAsync(status);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("listings/{id}/moderate")]
        public async Task<IActionResult> ModerateListing(int id, [FromBody] ListingModerationDto dto)
        {
            var res = await _adminService.ModerateListingAsync(id, dto);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] string? status)
        {
            var res = await _adminService.GetTransactionsAsync(status);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("reports")]
        public async Task<IActionResult> GetReports()
        {
            var res = await _adminService.GetReportsAsync();
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPatch("reports/{id}/action")]
        public async Task<IActionResult> ActionReport(int id, [FromBody] ReportActionDto dto)
        {
            var res = await _adminService.ActionReportAsync(id, dto);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var res = await _adminService.GetSettingsAsync();
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] PlatformSettings newSettings)
        {
            var res = await _adminService.UpdateSettingsAsync(newSettings);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("transactions/export-csv")]
        public async Task<IActionResult> ExportTransactionsCsv()
        {
            var bytes = await _adminService.ExportTransactionsCsvAsync();
            return File(bytes, "text/csv", "karajak_financial_log.csv");
        }
    }
}
