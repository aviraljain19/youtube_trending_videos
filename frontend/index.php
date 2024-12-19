<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Backend API URL
$apiUrl = 'http://localhost:3000/api/videos';

// Fetch data from the API with error handling
$options = ['http' => ['ignore_errors' => true]];
$context = stream_context_create($options);
$data = file_get_contents($apiUrl, false, $context);

// Check HTTP response
$httpCode = $http_response_header[0] ?? '';
if (!str_contains($httpCode, '200')) {
    die("Error: Failed to fetch data. API returned: $httpCode");
}

// Verify if data is fetched
if ($data === false || empty($data)) {
    die('Error: No data returned from the API.');
}

// Decode JSON and verify
$videos = json_decode($data, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    die('Error: Failed to decode JSON. ' . json_last_error_msg());
}

// Ensure videos is an array
if (!is_array($videos)) {
    die('Error: API response is not an array.');
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YouTube Trending Videos</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <h1>YouTube Trending Videos</h1>

    <button onclick="window.location.href='fetch.php'">Fetch Latest Videos</button>

    <div class="videos" style="display: flex;">
        <?php foreach ($videos as $video): ?>
            <div class="video" style="margin: 10px; text-align: center;">
                <a href="details.php?id=<?= htmlspecialchars($video['videoId']) ?>">
                    <img src="<?= htmlspecialchars($video['thumbnails']) ?>" 
                         alt="<?= htmlspecialchars($video['title']) ?>" 
                         style="width: 200px; height: 120px; border-radius: 8px;">
                </a>
                <h3>
                    <a href="details.php?id=<?= htmlspecialchars($video['videoId']) ?>" 
                       style="text-decoration: none; color: #333;">
                        <?= htmlspecialchars($video['title']) ?>
                    </a>
                </h3>
            </div>
        <?php endforeach; ?>
    </div>
</body>
</html>
