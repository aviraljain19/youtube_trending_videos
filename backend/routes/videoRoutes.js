require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Video = require("../models/Video");
const router = express.Router();
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer");

const launchBrowser = async () => {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--single-process",
        "--no-zygote",
      ],
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
    });
    return browser;
  } catch (error) {
    console.error("Error launching browser:", error);
    throw new Error("Failed to launch browser");
  }
};
const channelInfo = async (channelUrl) => {
  const browser3 = await launchBrowser();
  const page3 = await browser3.newPage();
  try {
    await page3.goto(channelUrl, { waitUntil: "networkidle2" });
    const channel = await page3.evaluate(() => {
      const channelEl = document.querySelector("yt-page-header-renderer");
      const channelSubscribersEl = channelEl.querySelectorAll(
        'span[class="yt-core-attributed-string yt-content-metadata-view-model-wiz__metadata-text yt-core-attributed-string--white-space-pre-wrap yt-core-attributed-string--link-inherit-color"]'
      );
      const channelSubscribers = channelSubscribersEl[1].innerText;
      const channelThumbnails = channelEl
        .querySelector(
          'img[class="yt-core-image yt-spec-avatar-shape__image yt-core-image--fill-parent-height yt-core-image--fill-parent-width yt-core-image--content-mode-scale-to-fill yt-core-image--loaded"]'
        )
        .getAttribute("src");
      const descriptionEl = channelEl.querySelectorAll(
        'span[class="yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap"]'
      );
      const channelDescription = descriptionEl[1].innerText;
      return {
        channelSubscribers,
        channelThumbnails,
        channelDescription,
      };
    });
    return channel;
  } catch (error) {
    console.error(`Error fetching video details`, error.message);
    return {
      channelSubscribers: "N/A",
      channelThumbnails: "N/A",
      channelDescription: "N/A",
    };
  } finally {
    await browser3.close();
  }
};

const videoInfo = async (vidUrl) => {
  const videoUrl = vidUrl;
  const browser2 = await launchBrowser();
  const page2 = await browser2.newPage();

  try {
    await page2.goto(videoUrl, { waitUntil: "networkidle2" });
    const videos = await page2.evaluate(() => {
      const videoInformation = document.querySelector("ytd-watch-metadata");
      const likes = videoInformation
        .querySelector(
          'button[class="yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m yt-spec-button-shape-next--icon-leading yt-spec-button-shape-next--segmented-start"]'
        )
        .getAttribute("aria-label")
        .split("with")[1]
        .split("other")[0]
        .trim();
      const viewsElement =
        videoInformation?.querySelector("span.view-count") ||
        document.querySelector("span.ytd-video-view-count-renderer");
      const views = viewsElement?.innerText || "N/A";
      var description = "";
      const descriptionLinesEl = videoInformation.querySelector(
        'span[class="yt-core-attributed-string yt-core-attributed-string--white-space-pre-wrap"]'
      );
      const descriptionLines = descriptionLinesEl.querySelectorAll(
        'span[class="yt-core-attributed-string--link-inherit-color"]'
      );
      descriptionLines.forEach((descriptionEL) => {
        description += descriptionEL.innerText;
      });

      return {
        views,
        likes,
        description,
      };
    });
    return videos;
  } catch (error) {
    console.error(`Error fetching video details`, error.message);
    return {
      likes: "N/A",
      views: "N/A",
      description: "N/A",
    };
  } finally {
    await browser2.close();
  }
};

const url = "https://www.youtube.com/feed/trending";
const fetchTrendingVideos = async () => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    const videos = await page.evaluate(() => {
      const videoElements = document.querySelectorAll("ytd-video-renderer");
      const videoData = [];
      videoElements.forEach((video) => {
        const videoId = video
          ?.querySelector('a[id="video-title"]')
          ?.getAttribute("href")
          ?.split("v=")[1];

        const videoDetails = {
          title: video.querySelector('a[id="video-title"]').innerText,
          videoId: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnails: `http://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channelTitle:
            video.querySelector('div[id="byline-container"]')?.innerText ||
            "Unknown Channel",
          channelUrl:
            video
              .querySelector('a[id="channel-thumbnail"]')
              ?.getAttribute("href") || "",
        };

        videoData.push(videoDetails);
      });

      return videoData;
    });
    console.log(videos);

    return videos;
  } catch (error) {
    console.error("Error scraping YouTube Trending:", error.message);
    return [];
  } finally {
    await browser.close();
  }
};

router.get("/fetch", async (req, res) => {
  try {
    const trendingVideos = await fetchTrendingVideos();
    for (const video of trendingVideos) {
      await Video.findOneAndUpdate(
        { videoId: video.videoId },
        {
          ...video,
          fetchedAt: `${new Date().getDate()}/${new Date().getMonth()}/${new Date().getFullYear()},${new Date().getHours()}:${new Date().getMinutes()}`,
        },
        { upsert: true, new: true }
      );
    }
    res.json({ success: true, message: "Trending videos updated." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

router.get("/", async (req, res) => {
  try {
    const latestFetch = await Video.findOne()
      .sort({ fetchedAt: -1 })
      .select("fetchedAt");
    console.log(latestFetch);

    if (!latestFetch) {
      return res.status(200).json({ videos: [] });
    }
    const videos = await Video.find({ fetchedAt: latestFetch.fetchedAt });
    console.log(videos);

    res.json(videos);
  } catch (error) {
    console.error("Error fetching latest videos:", error);
    res.status(500).json({ error: "Failed to fetch latest videos" });
  }
});

router.get("/:id", async (req, res) => {
  const video = await Video.findOne({ videoId: req.params.id });
  if (video) {
    const moreVideoInfo = await videoInfo(video.url);
    const chanInfo = await channelInfo(
      `https://www.youtube.com${video.channelUrl}`
    );
    const updated = await Video.findOneAndUpdate(
      { videoId: video.videoId },
      { ...moreVideoInfo, ...chanInfo },
      { upsert: true, new: true }
    );
    res.json(updated);
  } else {
    res.status(404).json({ error: "Video not found" });
  }
});

module.exports = router;
