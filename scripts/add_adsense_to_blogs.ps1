# Add AdSense to all blog posts
# Run from project root: .\scripts\add_adsense_to_blogs.ps1

$ADSENSE_HEAD = @'
  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1206702185649949"
    crossorigin="anonymous"></script>
  <style>
    .adsbygoogle-container { min-height: 100px; margin: 1.5rem 0; }
  </style>
'@

$AD_UNIT_TOP = @'

    <!-- Ad Unit: Top of Content -->
    <div class="adsbygoogle-container">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1206702185649949"
        data-ad-slot="AUTO"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>
'@

$AD_UNIT_BOTTOM = @'

    <!-- Ad Unit: End of Content -->
    <div class="adsbygoogle-container">
      <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-1206702185649949"
        data-ad-slot="AUTO"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    </div>

    <!-- Pro CTA -->
    <section class="mt-8 p-6 rounded-xl bg-indigo-50 border border-indigo-200">
      <h2 class="text-xl font-semibold text-indigo-900">Create Your vCard QR Code</h2>
      <p class="mt-2 text-indigo-800">Generate a professional digital business card in seconds - free and instant.</p>
      <div class="mt-4 flex flex-wrap gap-3">
        <a href="/" class="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Try Free Generator</a>
        <a href="/logo-qr-code.html" class="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-600 border border-indigo-300 hover:bg-indigo-50">Add Your Logo (Pro)</a>
      </div>
    </section>
'@

$blogDir = Join-Path $PSScriptRoot "..\blog"
$updated = 0
$skipped = 0

Get-ChildItem -Path $blogDir -Filter "*.html" -Recurse | ForEach-Object {
    $file = $_
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    
    # Skip if already has AdSense
    if ($content -match "adsbygoogle") {
        Write-Host "  Skipping (already has AdSense): $($file.FullName)"
        $skipped++
        return
    }
    
    $modified = $false
    
    # 1. Add AdSense script to <head>
    if ($content -match "</head>") {
        $content = $content -replace "</head>", "$ADSENSE_HEAD`n</head>"
        $modified = $true
    }
    
    # 2. Add top ad unit after </header>
    if ($content -match "</header>") {
        $content = $content -replace "</header>", "</header>$AD_UNIT_TOP"
        $modified = $true
    }
    
    # 3. Add bottom ad unit before </main>
    if ($content -match "</main>") {
        $content = $content -replace "</main>", "$AD_UNIT_BOTTOM`n  </main>"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Updated: $($file.FullName)"
        $updated++
    }
}

Write-Host "`nDone! Updated: $updated, Skipped: $skipped"
