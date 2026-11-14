using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Models;
using AspnetStarterApp.Services;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.RegisterAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.LoginAsync(dto);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        [HttpPost("admin-login")]
        public async Task<IActionResult> AdminLogin([FromBody] AdminLoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var result = await _authService.AdminLoginAsync(dto);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        [HttpPost("verify-2fa")]
        public async Task<IActionResult> Verify2Fa([FromBody] Verify2FaRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TempToken) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { success = false, message = "Temp token and 2FA code are required." });
            }

            var result = await _authService.VerifyAdmin2FaAsync(request.TempToken, request.Code);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.ForgotPasswordAsync(dto);
            return Ok(result);
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        // Demo quick-access endpoint for evaluators/grad committee to immediately log in with 1 click
        [HttpPost("quick-login/{role}")]
        public async Task<IActionResult> QuickLogin(string role)
        {
            string email = role.ToLower() switch
            {
                "admin" => "admin@karajak.ai",
                "seller" => "omar@gmail.com",
                _ => "ali@gmail.com"
            };

            var user = await _authService.LoginAsync(new LoginDto { Email = email, Password = role.ToLower() == "admin" ? "Admin123!" : (role.ToLower() == "seller" ? "Seller123!" : "Buyer123!") });
            return Ok(user);
        }
    }

    public class Verify2FaRequest
    {
        public string TempToken { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
