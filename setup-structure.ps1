# Navigate to the Angular project root
# Set-Location -Path aksiyona -ErrorAction Stop

# Core structure
$folders = @(
    "src/app/core/services",
    "src/app/core/interceptors",
    "src/app/core/guards",
    "src/app/core/models",
    "src/app/core/utils",
    "src/app/shared/components",
    "src/app/shared/directives",
    "src/app/shared/pipes",
    "src/app/features/auth/pages",
    "src/app/features/deals/pages",
    "src/app/features/users",
    "src/app/features/payments",
    "src/app/features/notifications",
    "src/app/state",
    "src/app/config",
    "src/app/assets",
    "src/app/environments"
)

# Create directories if they don't exist
foreach ($folder in $folders) {
    if (!(Test-Path -Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
}

# Files to create
$files = @(
    "src/app/features/auth/auth.routes.ts",
    "src/app/features/auth/pages/login.component.ts",
    "src/app/features/auth/pages/register.component.ts",
    "src/app/features/deals/deals.routes.ts",
    "src/app/features/deals/pages/deals-list.component.ts",
    "src/app/features/deals/pages/deal-detail.component.ts",
    "src/main.ts",
    "src/app/app.component.ts"
)

# Create empty files
foreach ($file in $files) {
    if (!(Test-Path -Path $file)) {
        New-Item -ItemType File -Path $file | Out-Null
    }
}

# Output success message
Write-Host "✅ Project structure created successfully!"
