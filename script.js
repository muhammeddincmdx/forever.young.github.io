// YouTube Data API v3 kullanımı için API key gerekiyor
// Google Cloud Console'dan bir API Key alın
const API_KEY = 'BURAYA_API_KEY_INI_YERLESTIRIN';
const REGION_CODE = 'US';  // RightNow trend için
const MAX_RESULTS = 10;

const ytList = document.getElementById('yt-trending');

async function fetchYouTubeTrending() {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=${REGION_CODE}&maxResults=${MAX_RESULTS}&key=${API_KEY}`;
    try {
        const res = await fetch(url);
        const data = await res.json();

        data.items.forEach(video => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="https://www.youtube.com/watch?v=${video.id}" target="_blank">
                ${video.snippet.title}
            </a>`;
            ytList.appendChild(li);
        });
    } catch (err) {
        console.error('YouTube trending fetch error:', err);
        ytList.innerHTML = '<li>Trendler alınamadı.</li>';
    }
}

fetchYouTubeTrending();
