using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarsController : ControllerBase
    {
        private readonly ICarService _carService;
        private readonly IWebHostEnvironment _env;

        public CarsController(ICarService carService, IWebHostEnvironment env)
        {
            _carService = carService;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetCars([FromQuery] CarFilterDto filter)
        {
            var res = await _carService.GetCarsAsync(filter);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCarById(int id)
        {
            var res = await _carService.GetCarByIdAsync(id);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("my-listings")]
        public async Task<IActionResult> GetMyListings([FromQuery] int sellerId)
        {
            var res = await _carService.GetMyListingsAsync(sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost("upload-image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var res = await _carService.UploadImageAsync(file, webRoot);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost]
        public async Task<IActionResult> CreateListing([FromBody] CarUpsertDto dto, [FromQuery] int sellerId)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var res = await _carService.CreateListingAsync(dto, sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] CarUpsertDto dto, [FromQuery] int sellerId)
        {
            var res = await _carService.UpdateListingAsync(id, dto, sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListing(int id, [FromQuery] int sellerId)
        {
            var res = await _carService.DeleteListingAsync(id, sellerId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
