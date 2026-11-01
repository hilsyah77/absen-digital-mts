$files = @("index.html", "scripts/app.js", "scripts/data.js")
foreach ($f in $files) {
    $lines = Get-Content $f -Encoding utf8
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match '[\u00C0-\u00FF]|[\uFFFD]|â|ð|ï|') {
            Write-Host "$f : Line $($i+1) : $line"
        }
    }
}
