# Test HttpListener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:8089/")
$listener.Start()
Write-Host "Listening on http://127.0.0.1:8089/"

$context = $listener.GetContext()
$req = $context.Request
Write-Host "Received: $($req.HttpMethod) $($req.Url)"

$reader = New-Object System.IO.StreamReader($req.InputStream)
$body = $reader.ReadToEnd()
Write-Host "Body length: $($body.Length)"

$res = $context.Response
$res.StatusCode = 200
$res.Headers.Add("Access-Control-Allow-Origin", "*")
$res.Close()
$listener.Stop()
