using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Api;
using Api.Authorization;
using Api.Authorization.Attributes;
using Api.Models;
using Api.Services;
using Api.Data.Specifications;

namespace Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotesController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ICurrentUserService _current;

        public NotesController(AppDbContext db, ICurrentUserService current)
        {
            _db = db;
            _current = current;
        }

        public record UpsertNoteRequest([Required, MaxLength(200)] string Title);

        // List: server-side ownership filtering (Basic sees own only; Admin sees all)
        [HttpGet]
        public async Task<ActionResult<object>> List()
        {
            var query = _db.Notes.AsNoTracking()
                .ApplyOwnershipFilter(_current.UserId, _current.Role);

            var items = await query
                .OrderBy(n => n.Title)
                .Select(n => new { n.Id, n.Title, n.CreatedBy })
                .ToListAsync();

            return Ok(new { data = items });
        }

        // Get by id: attribute-driven ownership check
        [HttpGet("{id:guid}")]
        [Authorize(Policy = Policies.OwnedBy)]
        [OwnedBy(typeof(Note), idParam: "id")]
        public async Task<ActionResult<object>> Get(Guid id)
        {
            var note = await _db.Notes.AsNoTracking().FirstOrDefaultAsync(n => n.Id == id);
            if (note == null) return NotFound();
            return Ok(new { data = new { note.Id, note.Title, note.CreatedBy } });
        }

        // Create: server sets CreatedBy from current user
        [HttpPost]
        public async Task<ActionResult<object>> Create([FromBody] UpsertNoteRequest request)
        {
            if (_current.UserId is null) return Unauthorized();

            var entity = new Note
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                CreatedBy = _current.UserId.Value
            };
            _db.Notes.Add(entity);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(Get), new { id = entity.Id }, new { data = new { entity.Id, entity.Title, entity.CreatedBy } });
        }

        // Update: attribute-driven ownership check
        [HttpPut("{id:guid}")]
        [Authorize(Policy = Policies.OwnedBy)]
        [OwnedBy(typeof(Note), idParam: "id")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpsertNoteRequest request)
        {
            var note = await _db.Notes.FirstOrDefaultAsync(n => n.Id == id);
            if (note == null) return NotFound();
            note.Title = request.Title;
            await _db.SaveChangesAsync();
            return NoContent();
        }

        // Delete: attribute-driven ownership check
        [HttpDelete("{id:guid}")]
        [Authorize(Policy = Policies.OwnedBy)]
        [OwnedBy(typeof(Note), idParam: "id")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var note = await _db.Notes.FirstOrDefaultAsync(n => n.Id == id);
            if (note == null) return NotFound();
            _db.Notes.Remove(note);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
