using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Api.Services;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/theme-preference")]
    [Authorize]
    public class ThemePreferenceController : ControllerBase
    {
        private readonly ThemePreferenceService _service;

        public ThemePreferenceController(ThemePreferenceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetTheme()
        {
            var theme = await _service.GetThemeAsync();
            return Ok(new { data = new { theme } });
        }

        public class SetThemeRequest
        {
            public string? Theme { get; set; }
        }

        [HttpPut]
        public async Task<IActionResult> SetTheme([FromBody] SetThemeRequest request)
        {
            if (request?.Theme is not ("light" or "dark"))
            {
                return BadRequest(new { error = new { code = "INVALID_THEME", message = "Theme must be 'light' or 'dark'." } });
            }

            var theme = await _service.SetThemeAsync(request.Theme);
            return Ok(new { data = new { theme } });
        }
    }
}
