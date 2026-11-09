$jdk = Get-ChildItem "C:\Program Files\Java" -Directory -Filter "jdk-21*" -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $jdk) { Write-Host "JDK 21 not found in C:\Program Files\Eclipse Adoptium" -ForegroundColor Red; return }
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version