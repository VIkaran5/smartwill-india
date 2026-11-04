$source = "C:\Users\dasar\OneDrive\Documents\New folder\smartwill-india"
$destination = "C:\Users\dasar\OneDrive\Documents\New folder\smartwill-india-rev13.zip"

if (Test-Path $destination) {
    Remove-Item $destination -Force
}

$items = Get-ChildItem -Path $source | Where-Object { $_.Name -ne 'node_modules' -and $_.Name -ne '.git' }
Compress-Archive -Path $items.FullName -DestinationPath $destination -CompressionLevel Optimal

$zipItem = Get-Item $destination
Write-Output "Created: $($zipItem.FullName) ($([math]::Round($zipItem.Length / 1MB, 2)) MB)"
