<?php
function file_get_contents_curl($url) {
$ch = curl_init();
curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); //Set curl to return the data instead of printing it to the browser.
curl_setopt($ch, CURLOPT_URL, $url);
$data = curl_exec($ch);
curl_close($ch);
return $data;
}
$videoId = $_GET['id'];
$apiUrl = "http://localhost:3000/api/videos/$videoId";
$data = file_get_contents($apiUrl);
$video = json_decode($data, true);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= $video['title'] ?></title>
</head>
<body>
    <h1><?= $video['title'] ?></h1>
    <iframe width="560" height="315" 
        src="https://www.youtube.com/embed/<?= $video['videoId'] ?>?autoplay=1" 
        frameborder="0" allow="autoplay" allowfullscreen>
    </iframe>
    <p><?= $video['description'] ?></p>
    <a href="index.php">Back to Trending Videos</a>
</body>
</html>
