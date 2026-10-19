# Resizes and re-encodes photos for the site.
#
#   1. drop full-size photos into  incoming/
#   2. npm run photos
#   3. they land in dist/places/ as web-sized JPEGs, same filename
#
# Windows only (uses System.Drawing). Nothing else in the project needs it.

param(
  [string]$From = "incoming",
  [string]$To   = "dist/places",
  [int]$MaxEdge = 1400,
  [int]$Quality = 82
)

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$src  = Join-Path $root $From
$dest = Join-Path $root $To

if (-not (Test-Path $src)) {
  New-Item -ItemType Directory -Force $src | Out-Null
  Write-Output "Created $From/. Put your photos in there and run this again."
  exit 0
}

$files = Get-ChildItem $src -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|heic|bmp|tif|tiff)$' }
if ($files.Count -eq 0) {
  Write-Output "No photos found in $From/."
  exit 0
}

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

foreach ($file in $files) {
  try {
    $img = [System.Drawing.Image]::FromFile($file.FullName)
  } catch {
    Write-Output ("  SKIP  {0}  (not readable as an image)" -f $file.Name)
    continue
  }

  # Phones record rotation in EXIF rather than rotating the pixels. Apply it,
  # otherwise portrait shots come out on their side.
  try {
    if ($img.PropertyIdList -contains 274) {
      $o = $img.GetPropertyItem(274).Value[0]
      switch ($o) {
        3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
        6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
        8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
      }
    }
  } catch {}

  $scale = [Math]::Min(1.0, $MaxEdge / [double][Math]::Max($img.Width, $img.Height))
  $w = [int][Math]::Round($img.Width * $scale)
  $h = [int][Math]::Round($img.Height * $scale)

  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(14, 14, 13))
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose()

  $before = [int]($file.Length / 1KB)
  $out = Join-Path $dest ($file.BaseName.ToLower() + ".jpg")
  if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Force $dest | Out-Null }
  $bmp.Save($out, $codec, $params)
  $bmp.Dispose(); $img.Dispose()

  $after = [int]((Get-Item $out).Length / 1KB)
  Write-Output ("  {0,-28} {1}x{2}   {3}KB -> {4}KB" -f ($file.BaseName.ToLower() + ".jpg"), $w, $h, $before, $after)
}

Write-Output ""
Write-Output "Done. Files are in $To/."
Write-Output "If a photo is yours, drop the credit and source fields from that"
Write-Output "entry in dist/main.js so the Wikimedia line stops showing."
