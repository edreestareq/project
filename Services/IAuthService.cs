using System.Threading.Tasks;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> AdminLoginAsync(AdminLoginDto dto);
        Task<AuthResponseDto> VerifyAdmin2FaAsync(string tempToken, string code);
        Task<AuthResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto dto);
        Task<UserDto?> GetUserByIdAsync(int id);
        string GenerateJwtToken(User user);
    }
}
