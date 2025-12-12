-- Debug SQL script for leaderboard data

-- Check account sizes
SELECT Id, Name, DisplayOrder
FROM AccountSizes;

-- Check accounts for Shashank Yogesh
SELECT a.Id, a.CompanyName, a.AccountSizeId, s.Name as SizeName
FROM Accounts a
JOIN Users u ON a.CreatedByUserId = u.Id
LEFT JOIN AccountSizes s ON a.AccountSizeId = s.Id
WHERE u.FullName = 'Shashank Yogesh'
AND a.IsDeleted = 0;

-- Check demos for Shashank Yogesh
SELECT 
    d.Id as DemoId,
    d.Status,
    d.DoneAt,
    d.DemoAlignedByUserId,
    u.FullName as AlignedByUser,
    a.Id as AccountId,
    a.CompanyName as AccountName,
    s.Id as SizeId,
    s.Name as AccountSize
FROM Demos d
JOIN Users u ON d.DemoAlignedByUserId = u.Id
LEFT JOIN Accounts a ON d.AccountId = a.Id
LEFT JOIN AccountSizes s ON a.AccountSizeId = s.Id
WHERE u.FullName = 'Shashank Yogesh'
AND d.Status = 'Completed'
AND d.IsDeleted = 0;

-- Check all completed demos in the system
SELECT 
    d.Id as DemoId,
    d.Status,
    d.DoneAt,
    d.DemoAlignedByUserId,
    u.FullName as AlignedByUser,
    a.Id as AccountId,
    a.CompanyName as AccountName,
    s.Id as SizeId,
    s.Name as AccountSize
FROM Demos d
JOIN Users u ON d.DemoAlignedByUserId = u.Id
LEFT JOIN Accounts a ON d.AccountId = a.Id
LEFT JOIN AccountSizes s ON a.AccountSizeId = s.Id
WHERE d.Status = 'Completed'
AND d.IsDeleted = 0;
