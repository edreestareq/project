using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public CarsController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCars([FromQuery] CarFilterDto filter)
        {
            var query = _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Where(c => c.Status == "Available" || c.Status == "Reserved")
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.SearchQuery))
            {
                var q = filter.SearchQuery.ToLower().Trim();
                query = query.Where(c => c.Brand.ToLower().Contains(q) ||
                                         c.Model.ToLower().Contains(q) ||
                                         c.Description.ToLower().Contains(q) ||
                                         c.FuelType.ToLower().Contains(q));
            }

            if (!string.IsNullOrWhiteSpace(filter.Brand))
            {
                query = query.Where(c => c.Brand.ToLower() == filter.Brand.ToLower().Trim());
            }

            if (!string.IsNullOrWhiteSpace(filter.Model))
            {
                query = query.Where(c => c.Model.ToLower().Contains(filter.Model.ToLower().Trim()));
            }

            if (filter.MinYear.HasValue) query = query.Where(c => c.Year >= filter.MinYear.Value);
            if (filter.MaxYear.HasValue) query = query.Where(c => c.Year <= filter.MaxYear.Value);
            if (filter.MinPrice.HasValue) query = query.Where(c => c.Price >= filter.MinPrice.Value);
            if (filter.MaxPrice.HasValue) query = query.Where(c => c.Price <= filter.MaxPrice.Value);
            if (filter.MaxMileage.HasValue) query = query.Where(c => c.Mileage <= filter.MaxMileage.Value);
            if (!string.IsNullOrWhiteSpace(filter.FuelType)) query = query.Where(c => c.FuelType.ToLower() == filter.FuelType.ToLower().Trim());
            if (!string.IsNullOrWhiteSpace(filter.Transmission)) query = query.Where(c => c.Transmission.ToLower() == filter.Transmission.ToLower().Trim());
            if (!string.IsNullOrWhiteSpace(filter.Location)) query = query.Where(c => c.Location.ToLower().Contains(filter.Location.ToLower().Trim()));

            query = filter.SortBy switch
            {
                "price_asc" => query.OrderBy(c => c.Price),
                "price_desc" => query.OrderByDescending(c => c.Price),
                "year_desc" => query.OrderByDescending(c => c.Year),
                "mileage_asc" => query.OrderBy(c => c.Mileage),
                _ => query.OrderByDescending(c => c.CreatedAt)
            };

            var totalItems = await query.CountAsync();
            var items = await query
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return Ok(new
            {
                Total = totalItems,
                Page = filter.Page,
                PageSize = filter.PageSize,
                Data = items
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCarById(int id)
        {
            var car = await _context.Cars
                .Include(c => c.Images)
                .Include(c => c.Seller)
                .Include(c => c.Reviews)
                    .ThenInclude(r => r.Buyer)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null) return NotFound(new { message = "Vehicle listing unavailable." });

            return Ok(car);
        }

        [HttpGet("my-listings")]
        public async Task<IActionResult> GetMyListings([FromQuery] int sellerId)
        {
            var listings = await _context.Cars
                .Include(c => c.Images)
                .Where(c => c.SellerId == sellerId)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(listings);
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "يرجى اختيار صورة صالحة." });
            }

            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "حجم الصورة يتجاوز الحد المسموح (10MB)." });
            }

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowed.Contains(ext))
            {
                return BadRequest(new { message = "صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WEBP." });
            }

            var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cars");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/cars/{fileName}" });
        }

        [HttpPost]
        public async Task<IActionResult> CreateListing([FromBody] CarUpsertDto dto, [FromQuery] int sellerId)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var seller = await _context.Users.FindAsync(sellerId);
            if (seller == null || seller.Role != "Seller")
            {
                return StatusCode(403, new { message = "Only registered Seller accounts can create vehicle listings." });
            }

            var car = new Car
            {
                SellerId = sellerId,
                Brand = dto.Brand.Trim(),
                Model = dto.Model.Trim(),
                Year = dto.Year,
                Price = dto.Price,
                Mileage = dto.Mileage,
                FuelType = dto.FuelType,
                Transmission = dto.Transmission,
                Color = dto.Color,
                Location = dto.Location,
                Description = string.IsNullOrWhiteSpace(dto.Description) ? string.Empty : dto.Description.Trim(),
                DriveTrain = string.IsNullOrWhiteSpace(dto.DriveTrain) ? null : dto.DriveTrain.Trim(),
                BatteryCapacity = dto.BatteryCapacity,
                ChargingType = dto.ChargingType,
                RangePerCharge = dto.RangePerCharge,
                EngineSize = string.IsNullOrWhiteSpace(dto.EngineSize) ? null : dto.EngineSize.Trim(),
                FuelConsumption = dto.FuelConsumption,
                HybridMode = dto.HybridMode,
                KeyFeatures = dto.KeyFeatures != null && dto.KeyFeatures.Any() ? string.Join(", ", dto.KeyFeatures) : null,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            if (dto.Images != null && dto.Images.Any())
            {
                for (int i = 0; i < dto.Images.Count; i++)
                {
                    if (!string.IsNullOrWhiteSpace(dto.Images[i]))
                    {
                        car.Images.Add(new CarImage
                        {
                            ImageUrl = dto.Images[i].Trim(),
                            IsPrimary = (i == 0)
                        });
                    }
                }
            }

            _context.Cars.Add(car);
            await _context.SaveChangesAsync();

            // Admin notification
            _context.Notifications.Add(new Notification
            {
                UserId = 1, // Admin
                Title = "New Listing Awaiting Review",
                Content = $"{car.Year} {car.Brand} {car.Model} submitted by {seller.FullName}.",
                Type = "Listing"
            });
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCarById), new { id = car.Id }, car);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] CarUpsertDto dto, [FromQuery] int sellerId)
        {
            var car = await _context.Cars.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == id);
            if (car == null) return NotFound(new { message = "Listing not found." });

            if (car.SellerId != sellerId)
            {
                var user = await _context.Users.FindAsync(sellerId);
                if (user == null || user.Role != "Admin")
                {
                    return Forbid();
                }
            }

            car.Brand = dto.Brand;
            car.Model = dto.Model;
            car.Year = dto.Year;
            car.Price = dto.Price;
            car.Mileage = dto.Mileage;
            car.FuelType = dto.FuelType;
            car.Transmission = dto.Transmission;
            car.Color = dto.Color;
            car.Location = dto.Location;
            car.Description = dto.Description;
            car.DriveTrain = dto.DriveTrain ?? car.DriveTrain;

            if (dto.Images != null && dto.Images.Any())
            {
                _context.CarImages.RemoveRange(car.Images);
                for (int i = 0; i < dto.Images.Count; i++)
                {
                    car.Images.Add(new CarImage { ImageUrl = dto.Images[i], IsPrimary = (i == 0) });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(car);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListing(int id, [FromQuery] int sellerId)
        {
            var car = await _context.Cars.FindAsync(id);
            if (car == null) return NotFound(new { message = "Listing not found." });

            if (car.SellerId != sellerId)
            {
                var user = await _context.Users.FindAsync(sellerId);
                if (user == null || user.Role != "Admin") return Forbid();
            }

            _context.Cars.Remove(car);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Listing removed successfully." });
        }
    }
}
