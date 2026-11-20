using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

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
                return BadRequest(new { success = false, message = "Temp token and 2FA code are required." });

            var result = await _authService.VerifyAdmin2FaAsync(request.TempToken, request.Code);
            if (!result.Success) return Unauthorized(result);
            return Ok(result);
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            return Ok(await _authService.ForgotPasswordAsync(dto));
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("quick-login/{role}")]
        public async Task<IActionResult> QuickLogin(string role)
        {
            string email = role.ToLower() switch
            {
                "admin" => "admin@karajak.ai",
                "seller" => "seller@karajak.ai",
                _ => "buyer@karajak.ai"
            };

            string password = role.ToLower() switch
            {
                "admin" => "Admin123!",
                "seller" => "Seller123!",
                _ => "Buyer123!"
            };

            var user = await _authService.LoginAsync(new LoginDto { Email = email, Password = password });
            return Ok(user);
        }
    }

    public class Verify2FaRequest
    {
        public string TempToken { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }
}
