# PS Remote Play のウィンドウを一定時間連写し、前に保存したコマから画面が変わったコマだけを PNG で保存する。
# 最後に、保存したコマを縮小して番号付きで並べた一覧画像（sheet-*.png）を作る。
# 出力: 保存先フォルダのパス、保存したコマ数、一覧画像のパス
# 使い方: pwsh -File .claude/skills/ps5-capture/capture-burst.ps1 -Seconds 10 -IntervalMs 500 -Name items
param(
  [int]$Seconds = 10,
  # 撮る間隔（ミリ秒）。実際の間隔は撮影と比較の時間の分だけ長くなる
  [int]$IntervalMs = 500,
  # 変化とみなす差（縮小したグレー画像の平均差、0〜255）。小さいほど細かな変化でも保存する
  [double]$Threshold = 4.0,
  # 比べる範囲（ウィンドウに対する割合 0〜1）。既定は全体。ツールチップの所だけ比べたいときに絞る
  [double]$RegionX = 0, [double]$RegionY = 0, [double]$RegionW = 1, [double]$RegionH = 1,
  [string]$Name = 'burst',
  [string]$ProcessName = 'RemotePlay'
)
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$safeName = ($Name -replace '[^A-Za-z0-9\-]', '')
if (-not $safeName) { $safeName = 'burst' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $repoRoot "_local\ps5-captures\$stamp-$safeName"
New-Item -ItemType Directory -Force $outDir | Out-Null

Add-Type -AssemblyName System.Drawing
if (-not ('Ps5Cap' -as [type])) {
  Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Ps5Cap {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
}
'@
}
[void][Ps5Cap]::SetProcessDPIAware()

$proc = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue |
  Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Error "PS Remote Play のウィンドウが見つかりません（プロセス名: $ProcessName）。"; exit 1 }
$h = $proc.MainWindowHandle

function Get-Frame {
  if ([Ps5Cap]::IsIconic($h)) { throw 'PS Remote Play のウィンドウが最小化されています。' }
  $r = New-Object Ps5Cap+RECT
  [void][Ps5Cap]::GetWindowRect($h, [ref]$r)
  $w = $r.Right - $r.Left; $hh = $r.Bottom - $r.Top
  $bmp = New-Object System.Drawing.Bitmap $w, $hh
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $hdc = $g.GetHdc()
  [void][Ps5Cap]::PrintWindow($h, $hdc, 2)
  $g.ReleaseHdc($hdc); $g.Dispose()
  return $bmp
}

# 比べる範囲を 64x36 のグレー値の配列にする
function Get-Signature([System.Drawing.Bitmap]$bmp) {
  $sw = 64; $sh = 36
  $src = New-Object System.Drawing.Rectangle ([int]($bmp.Width * $RegionX)), ([int]($bmp.Height * $RegionY)), ([int]($bmp.Width * $RegionW)), ([int]($bmp.Height * $RegionH))
  $small = New-Object System.Drawing.Bitmap $sw, $sh
  $g = [System.Drawing.Graphics]::FromImage($small)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::Bilinear
  $g.DrawImage($bmp, (New-Object System.Drawing.Rectangle 0, 0, $sw, $sh), $src, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $sig = New-Object 'double[]' ($sw * $sh)
  for ($y = 0; $y -lt $sh; $y++) { for ($x = 0; $x -lt $sw; $x++) {
    $c = $small.GetPixel($x, $y); $sig[$y * $sw + $x] = 0.299 * $c.R + 0.587 * $c.G + 0.114 * $c.B } }
  $small.Dispose()
  return ,$sig
}

function Get-Diff($a, $b) {
  $sum = 0.0
  for ($i = 0; $i -lt $a.Length; $i++) { $sum += [Math]::Abs($a[$i] - $b[$i]) }
  return $sum / $a.Length
}

$saved = New-Object System.Collections.Generic.List[string]
$lastSig = $null
$taken = 0
$sw = [System.Diagnostics.Stopwatch]::StartNew()
while ($sw.Elapsed.TotalSeconds -lt $Seconds) {
  $t0 = $sw.ElapsedMilliseconds
  $bmp = Get-Frame
  $taken++
  try {
    $sig = Get-Signature $bmp
    $diff = if ($lastSig) { Get-Diff $sig $lastSig } else { [double]::MaxValue }
    if ($diff -ge $Threshold) {
      $idx = $saved.Count + 1
      $path = Join-Path $outDir ('{0:D3}-{1:F1}s.png' -f $idx, $sw.Elapsed.TotalSeconds)
      $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
      $saved.Add($path)
      $lastSig = $sig
    }
  } finally { $bmp.Dispose() }
  $wait = $IntervalMs - ($sw.ElapsedMilliseconds - $t0)
  if ($wait -gt 0) { Start-Sleep -Milliseconds $wait }
}
$sw.Stop()

# 一覧画像（1コマ 320px 幅、5列、左上に番号）
$sheetPath = $null
if ($saved.Count -gt 0) {
  $cols = [Math]::Min(5, $saved.Count)
  $rows = [Math]::Ceiling($saved.Count / $cols)
  $first = [System.Drawing.Image]::FromFile($saved[0])
  $tw = 320; $th = [int]($first.Height * $tw / $first.Width); $first.Dispose()
  $sheet = New-Object System.Drawing.Bitmap ($tw * $cols), ($th * $rows)
  $g = [System.Drawing.Graphics]::FromImage($sheet)
  $g.Clear([System.Drawing.Color]::Black)
  $font = New-Object System.Drawing.Font 'Segoe UI', 14, ([System.Drawing.FontStyle]::Bold)
  for ($i = 0; $i -lt $saved.Count; $i++) {
    $img = [System.Drawing.Image]::FromFile($saved[$i])
    $x = ($i % $cols) * $tw; $y = [Math]::Floor($i / $cols) * $th
    $g.DrawImage($img, $x, $y, $tw, $th); $img.Dispose()
    $label = '{0:D3}' -f ($i + 1)
    $g.FillRectangle([System.Drawing.Brushes]::Black, $x, $y, 48, 26)
    $g.DrawString($label, $font, [System.Drawing.Brushes]::Yellow, $x + 2, $y + 1)
  }
  $font.Dispose(); $g.Dispose()
  $sheetPath = Join-Path $outDir 'sheet.png'
  $sheet.Save($sheetPath, [System.Drawing.Imaging.ImageFormat]::Png); $sheet.Dispose()
}

"dir=$outDir"
"taken=$taken saved=$($saved.Count) seconds=$([Math]::Round($sw.Elapsed.TotalSeconds,1))"
if ($sheetPath) { "sheet=$sheetPath" }
