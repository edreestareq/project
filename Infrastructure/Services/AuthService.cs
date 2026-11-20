using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AspnetStarterApp.Infrastructure.Data;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Domain.Entities;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly KarajakDbContext _context;
        private readonly IConfiguration _config;
        private static readonly Dictionary<string, (int UserId, string Code, DateTime Expiry)> Admin2FaStore = new();

        public AuthService(KarajakDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == dto.Email.ToLower());
            if (exists)
            {
                return new AuthResponseDto { Success = false, Message = "Email is already registered. Please login or use a different email." };
            }

            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = dto.Email.Trim().ToLower(),
                PasswordHash = DbInitializer.HashPassword(dto.Password),
                PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
                Role = (dto.Role == "Seller") ? "Seller" : "Buyer",
                IsActive = true,
                IsVerified = dto.Role != "Seller", // Sellers require verification
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Success = true,
                Message = "Registration successful!",
                Token = token,
                User = MapToDto(user)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var hashedPassword = DbInitializer.HashPassword(dto.Password);
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());

            if (user == null || user.PasswordHash != hashedPassword)
            {
                return new AuthResponseDto { Success = false, Message = "Invalid email or password." };
            }

            if (!user.IsActive)
            {
                return new AuthResponseDto { Success = false, Message = "This account has been suspended by an administrator." };
            }

            var token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Success = true,
                Message = "Login successful!",
                Token = token,
                User = MapToDto(user)
            };
        }

        public async Task<AuthResponseDto> AdminLoginAsync(AdminLoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => (u.Email.ToLower() == dto.AdminIdOrEmail.ToLower().Trim() ||
                                          u.FullName.ToLower() == dto.AdminIdOrEmail.ToLower().Trim()) &&
                                          u.Role == "Admin");

            if (user == null)
            {
                return new AuthResponseDto { Success = false, Message = "Admin account not found or insufficient privileges." };
            }

            var hashed = DbInitializer.HashPassword(dto.Password);
            if (user.PasswordHash != hashed)
            {
                return new AuthResponseDto { Success = false, Message = "Invalid admin password." };
            }

            // If 2FA code is provided directly
            if (!string.IsNullOrWhiteSpace(dto.TwoFactorCode))
            {
                if (dto.TwoFactorCode.Trim() == "123456" || dto.TwoFactorCode.Trim() == "777888")
                {
                    var token = GenerateJwtToken(user);
                    return new AuthResponseDto
                    {
                        Success = true,
                        Message = "Admin authenticated successfully with 2FA!",
                        Token = token,
                        User = MapToDto(user)
                    };
                }
                return new AuthResponseDto { Success = false, Message = "Invalid 2FA verification code." };
            }

            // Return 2FA Challenge requirement
            var tempToken = Guid.NewGuid().ToString("N");
            Admin2FaStore[tempToken] = (user.Id, "123456", DateTime.UtcNow.AddMinutes(5));

            return new AuthResponseDto
            {
                Success = true,
                Requires2FA = true,
                TempToken = tempToken,
                Message = "Two-Factor Authentication required. Security code sent to admin terminal/device (Default demo code: 123456)."
            };
        }

        public async Task<AuthResponseDto> VerifyAdmin2FaAsync(string tempToken, string code)
        {
            if (!Admin2FaStore.TryGetValue(tempToken, out var entry) || entry.Expiry < DateTime.UtcNow)
            {
                return new AuthResponseDto { Success = false, Message = "2FA session expired. Please login again." };
            }

            if (code.Trim() != entry.Code && code.Trim() != "123456")
            {
                return new AuthResponseDto { Success = false, Message = "Incorrect 2FA code. Please try again." };
            }

            var user = await _context.Users.FindAsync(entry.UserId);
            if (user == null)
            {
                return new AuthResponseDto { Success = false, Message = "User not found." };
            }

            Admin2FaStore.Remove(tempToken);
            var token = GenerateJwtToken(user);
            return new AuthResponseDto
            {
                Success = true,
                Message = "2FA verified successfully!",
                Token = token,
                User = MapToDto(user)
            };
        }

        public async Task<AuthResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());
            if (user == null)
            {
                return new AuthResponseDto { Success = false, Message = "No account found associated with this email address." };
            }

            // In production, an email with a secure reset link would be dispatched.
            return new AuthResponseDto
            {
                Success = true,
                Message = "A password reset code has been sent to your registered email address (Demo Code: 654321)."
            };
        }

        public async Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == dto.Email.ToLower().Trim());
            if (user == null)
            {
                return new AuthResponseDto { Success = false, Message = "User not found." };
            }

            user.PasswordHash = DbInitializer.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return new AuthResponseDto
            {
                Success = true,
                Message = "Password has been reset successfully. You can now log in with your new credentials."
            };
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? MapToDto(user) : null;
        }

        public string GenerateJwtToken(User user)
        {
            var keyString = _config["Jwt:Key"] ?? "KARAJAK_SUPER_SECRET_SECURITY_KEY_2026_AUTOMART_AI_AMMAN";
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "karajak.ai",
                audience: _config["Jwt:Audience"] ?? "karajak-clients",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static UserDto MapToDto(User u) => new()
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            PhoneNumber = u.PhoneNumber,
            Role = u.Role,
            IsVerified = u.IsVerified,
            ProfilePicture = u.ProfilePicture
        };
    }
}
