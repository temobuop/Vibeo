# Get the list of uncommitted files
$statusLines = git status --porcelain

if (-not $statusLines) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit
}

foreach ($line in $statusLines) {
    if ($line -match '^..(.*)') {
        $file = $Matches[1].Trim()
        $status = $line.Substring(0, 2).Trim()
        
        $action = "Update"
        if ($status -eq "??") { $action = "Add" }
        if ($status -eq "D") { $action = "Delete" }
        
        Write-Host "Committing: $file" -ForegroundColor Cyan
        git add "$file"
        git commit -m "$action $file"
    }
}

Write-Host "All files committed one by one." -ForegroundColor Green
