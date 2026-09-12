# Check available image encoders in .NET
Add-Type -AssemblyName System.Drawing
$codecs = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()
foreach ($c in $codecs) {
    Write-Host ("Codec: " + $c.FormatDescription + " - " + $c.MimeType)
}
