# PS Remote Play のウィンドウを PNG に保存し、保存先のパスを出力する。
# 方式: PrintWindow（PW_RENDERFULLCONTENT）。ほかのウィンドウが重なっていても撮れる。最小化中は撮れない。
# 使い方: pwsh -File .claude/skills/ps5-capture/capture-remoteplay.ps1 [-Name 名前]
param(
  # ファイル名に付ける短い名前（例: miut-tooltip）。英数字とハイフンのみ
  [string]$Name = '',
  [string]$ProcessName = 'RemotePlay'
)
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$outDir = Join-Path $repoRoot '_local\ps5-captures'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force $outDir | Out-Null }

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
if (-not $proc) { Write-Error "PS Remote Play のウィンドウが見つかりません（プロセス名: $ProcessName）。アプリが起動しているか確かめてください。"; exit 1 }
$h = $proc.MainWindowHandle
if ([Ps5Cap]::IsIconic($h)) { Write-Error 'PS Remote Play のウィンドウが最小化されています。元に戻してから撮ってください。'; exit 1 }

$r = New-Object Ps5Cap+RECT
[void][Ps5Cap]::GetWindowRect($h, [ref]$r)
$w = $r.Right - $r.Left
$hgt = $r.Bottom - $r.Top
if ($w -le 0 -or $hgt -le 0) { Write-Error "ウィンドウの大きさが取れません（${w}x${hgt}）。"; exit 1 }

$bmp = New-Object System.Drawing.Bitmap $w, $hgt
try {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $hdc = $g.GetHdc()
  $ok = [Ps5Cap]::PrintWindow($h, $hdc, 2)
  $g.ReleaseHdc($hdc)
  $g.Dispose()
  if (-not $ok) { Write-Error 'PrintWindow に失敗しました。'; exit 1 }

  $safeName = ($Name -replace '[^A-Za-z0-9\-]', '')
  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $file = if ($safeName) { "$stamp-$safeName.png" } else { "$stamp.png" }
  $path = Join-Path $outDir $file
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
  $bmp.Dispose()
}
$path
