param(
    [string]$Command,
    [string]$Label
)

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
Write-Host "Executing: $Command"
Invoke-Expression $Command
$stopwatch.Stop()

$elapsed = $stopwatch.Elapsed.TotalSeconds
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$header = "## $Label ($timestamp)"
$cmdStr = "Command: ``$Command```"
$timeStr = "Time: **$elapsed seconds**"

$filePath = "c:\Users\moxch\Documents\GitHub\bensa\linttest.md"

$header | Out-File -FilePath $filePath -Append -Encoding utf8
"" | Out-File -FilePath $filePath -Append -Encoding utf8
$cmdStr | Out-File -FilePath $filePath -Append -Encoding utf8
"" | Out-File -FilePath $filePath -Append -Encoding utf8
$timeStr | Out-File -FilePath $filePath -Append -Encoding utf8
"" | Out-File -FilePath $filePath -Append -Encoding utf8

Write-Host "Benchmarked $Label: $elapsed seconds"
Write-Host "Results saved to $filePath"
