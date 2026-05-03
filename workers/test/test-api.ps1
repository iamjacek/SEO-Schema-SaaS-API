# SEO Schema SaaS API - Comprehensive Test Suite
# Tests: Product, LocalBusiness, Article

#  RUN WITH TOKEN:
# .\test-api.ps1 -Token "demo-token"

#  RUN WITH TOKEN and custom endpoint:
# .\test-api.ps1 -Token "demo-token" -BaseUri "http://localhost:8787/generate"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUri = "http://127.0.0.1:8787/generate"
)

# Validate token is provided
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "ERROR: Token parameter is required!" -ForegroundColor Red
    Write-Host "Usage: .\test-api.ps1 -Token 'your-token-here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using token: $($Token.Substring(0, 10))..." -ForegroundColor Cyan
Write-Host "Using API endpoint: $BaseUri" -ForegroundColor Cyan
Write-Host ""

# Track results
$results = @()

# ==================== TEST 1: PRODUCT ====================
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST 1: Complex E-Commerce Product" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$body1 = @{
    contentType = "Product"
    title = "Premium Stainless Steel French Press Coffee Maker 34oz with Microfilter"
    brief = "Professional-grade French press with triple-layer microfilter, borosilicate glass, stainless steel frame. Perfect for home baristas. Brewing capacity: 34oz. Compatible with all grind sizes. Includes measuring spoon and cleaning brush. Dishwasher safe. Award-winning design featured in Coffee Magazine 2025."
    language = "en"
    tone = "professional"
    targetKeyword = "premium french press coffee maker"
    siteName = "Expresso Elite"
    brandVoice = "luxury, professional, eco-conscious"
    baseUrl = "https://expresso.com"
} | ConvertTo-Json -Depth 10

try {
    $startTime = Get-Date
    $response1 = Invoke-RestMethod `
      -Method POST `
      -Uri $BaseUri `
      -Headers @{
        Authorization = "Bearer $Token"
        "Content-Type" = "application/json"
      } `
      -Body $body1

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response time: ${duration}ms" -ForegroundColor Green
    Write-Host "Tokens used - Input: $($response1.data.tokens.input), Output: $($response1.data.tokens.output)" -ForegroundColor Green
    Write-Host "Meta Title: $($response1.data.result.metaTitle)" -ForegroundColor Green
    
    $results += @{
        Test = "Product (Complex)"
        Status = "✅ PASS"
        Duration = "$($duration)ms"
        InputTokens = $response1.data.tokens.input
        OutputTokens = $response1.data.tokens.output
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full Error:" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
    Write-Host "Response content:" -ForegroundColor Red
    Write-Host $_.Content -ForegroundColor Red

    $results += @{
        Test = "Product (Complex)"
        Status = "❌ FAIL"
        Error = $_.Exception.Message
    }
}

Write-Host ""

# ==================== TEST 2: LOCAL BUSINESS ====================
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST 2: Local Business / Professional Services" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$body2 = @{
    contentType = "LocalBusiness"
    title = "Premium Dental Care Center - New York Manhattan"
    brief = "State-of-the-art dental practice offering comprehensive oral healthcare including cosmetic dentistry, implants, orthodontics, and preventive care. Board-certified dentists with 20+ years combined experience. Same-day appointments available. Insurance accepted. Located in Manhattan with easy parking and wheelchair access."
    language = "en"
    tone = "trustworthy"
    targetKeyword = "dentist near me new york"
    siteName = "Smile Dental NYC"
    brandVoice = "caring, professional, welcoming"
    baseUrl = "https://smiledental-nyc.com"
} | ConvertTo-Json -Depth 10

try {
    $startTime = Get-Date
    $response2 = Invoke-RestMethod `
      -Method POST `
      -Uri $BaseUri `
      -Headers @{
        Authorization = "Bearer $Token"
        "Content-Type" = "application/json"
      } `
      -Body $body2

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response time: ${duration}ms" -ForegroundColor Green
    Write-Host "Tokens used - Input: $($response2.data.tokens.input), Output: $($response2.data.tokens.output)" -ForegroundColor Green
    Write-Host "Meta Title: $($response2.data.result.metaTitle)" -ForegroundColor Green

    $results += @{
        Test = "LocalBusiness (Services)"
        Status = "✅ PASS"
        Duration = "$($duration)ms"
        InputTokens = $response2.data.tokens.input
        OutputTokens = $response2.data.tokens.output
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full Error:" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
    Write-Host "Response content:" -ForegroundColor Red
    Write-Host $_.Content -ForegroundColor Red

    $results += @{
        Test = "LocalBusiness (Services)"
        Status = "❌ FAIL"
        Error = $_.Exception.Message
    }
}

Write-Host ""

# ==================== TEST 3: ARTICLE ====================
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST 3: Blog Article / Content Marketing" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$body3 = @{
    contentType = "Article"
    title = "The Complete Guide to Sustainable Coffee Sourcing: 2026 Best Practices and Certifications"
    brief = "Comprehensive guide exploring ethical coffee sourcing, fair trade certifications, direct trade relationships with farmers, carbon-neutral shipping, and environmental impact. Covers certification systems (Fair Trade, Rainforest Alliance, UTZ), farmer cooperative models, quality metrics, pricing transparency, and emerging sustainability trends. Includes interviews with 5 coffee experts and case studies from 3 leading specialty roasters. Discover how to source premium coffee while supporting farmer communities and protecting the environment."
    language = "en"
    tone = "informative"
    targetKeyword = "sustainable coffee sourcing"
    siteName = "Coffee Institute"
    brandVoice = "educational, passionate, eco-conscious"
    baseUrl = "https://coffee-institute.io"
    imageUrl = "https://coffee-institute.io/images/sustainable-coffee-guide.jpg"
} | ConvertTo-Json -Depth 10

try {
    $startTime = Get-Date
    $response3 = Invoke-RestMethod `
      -Method POST `
      -Uri $BaseUri `
      -Headers @{
        Authorization = "Bearer $Token"
        "Content-Type" = "application/json"
      } `
      -Body $body3

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds

    Write-Host "✅ SUCCESS" -ForegroundColor Green
    Write-Host "Response time: ${duration}ms" -ForegroundColor Green
    Write-Host "Tokens used - Input: $($response3.data.tokens.input), Output: $($response3.data.tokens.output)" -ForegroundColor Green
    Write-Host "Meta Title: $($response3.data.result.metaTitle)" -ForegroundColor Green

    $results += @{
        Test = "Article (Content Heavy)"
        Status = "✅ PASS"
        Duration = "$($duration)ms"
        InputTokens = $response3.data.tokens.input
        OutputTokens = $response3.data.tokens.output
    }
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Full Error:" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
    Write-Host "Response content:" -ForegroundColor Red
    Write-Host $_.Content -ForegroundColor Red

    $results += @{
        Test = "Article (Content Heavy)"
        Status = "❌ FAIL"
        Error = $_.Exception.Message
    }
}

Write-Host ""

# ==================== SUMMARY ====================
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "TEST SUMMARY" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow

$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Total tests: $($results.Count)" -ForegroundColor Cyan

# Fixed count calculation
$passCount = @($results | Where-Object { $_.Status -like '✅*' }).Count
$failCount = @($results | Where-Object { $_.Status -like '❌*' }).Count

Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0 -and $passCount -eq 3) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
} elseif ($failCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  SOME TESTS FAILED - CHECK ABOVE FOR DETAILS" -ForegroundColor Yellow
}