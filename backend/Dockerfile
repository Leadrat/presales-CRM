# Backend Dockerfile for ASP.NET Core API
# Multi-stage build: restore + publish, then run on aspnet runtime image

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY Api.csproj ./
RUN dotnet restore Api.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Expose HTTP port and configure Kestrel to listen on all interfaces
ENV ASPNETCORE_URLS=http://0.0.0.0:5033
EXPOSE 5033

ENTRYPOINT ["dotnet", "Api.dll"]
