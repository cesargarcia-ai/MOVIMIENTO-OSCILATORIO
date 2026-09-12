Add-Type -AssemblyName System.Drawing
$p = [System.Drawing.Image]::FromFile('C:\Users\DELL\OneDrive\Escritorio\Cuaderno Virtual Fisica III\Portada.jpg')
Write-Host "Portada: $($p.Width) x $($p.Height)"
$p.Dispose()

$h = [System.Drawing.Image]::FromFile('C:\Users\DELL\OneDrive\Escritorio\Cuaderno Virtual Fisica III\Hojas.jpg')
Write-Host "Hojas: $($h.Width) x $($h.Height)"
$h.Dispose()
