param(
  [Parameter(Mandatory = $true)][string]$File,
  [Parameter(Mandatory = $true)][string]$StartAnchor,
  [Parameter(Mandatory = $true)][string]$EndAnchor,   # exact line, or "<EOF>"
  [Parameter(Mandatory = $true)][string]$ContentFile
)
# Replaces lines [StartAnchor, EndAnchor) of $File with the lines of $ContentFile.
# Keeps UTF-8 without BOM and CRLF line endings.
$enc = New-Object System.Text.UTF8Encoding $false
$lines = [System.IO.File]::ReadAllLines($File, $enc)
$s = [Array]::IndexOf($lines, $StartAnchor)
if ($s -lt 0) { throw "Start anchor not found: $StartAnchor" }
if ($EndAnchor -eq '<EOF>') { $e = $lines.Length }
else {
  $e = -1
  for ($i = $s + 1; $i -lt $lines.Length; $i++) { if ($lines[$i] -eq $EndAnchor) { $e = $i; break } }
  if ($e -lt 0) { throw "End anchor not found after start: $EndAnchor" }
}
$new = [System.IO.File]::ReadAllLines($ContentFile, $enc)
$before = if ($s -gt 0) { $lines[0..($s - 1)] } else { @() }
$after = if ($e -lt $lines.Length) { $lines[$e..($lines.Length - 1)] } else { @() }
$out = @($before) + @($new) + @($after)
[System.IO.File]::WriteAllLines($File, [string[]]$out, $enc)
"Replaced lines $($s + 1)-$e with $($new.Length) lines in $File"
