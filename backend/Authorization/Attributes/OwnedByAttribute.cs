using System;

namespace Api.Authorization.Attributes
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
    public sealed class OwnedByAttribute : Attribute
    {
        public Type EntityType { get; }
        public string IdParam { get; }

        public OwnedByAttribute(Type entityType, string idParam = "id")
        {
            EntityType = entityType ?? throw new ArgumentNullException(nameof(entityType));
            IdParam = string.IsNullOrWhiteSpace(idParam) ? "id" : idParam;
        }
    }
}
