
  
  const ytList = document.getElementById('yt-list');
  
  youtubeTrends.forEach(song => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${song}</span>
      <div>
        <button onclick="playSong('${song}')">▶️</button>
        <button onclick="openYouTube('${song}')">➕</button>
      </div>
    `;
    ytList.appendChild(li);
  });
  
  function openYouTube(song) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`;
    window.open(url, '_blank');
  }
  
  function playSong(song) {
    // Yalnızca yeni bir sekmede açarak çalma efekti verelim
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`;
    window.open(searchUrl, '_blank');
  }
  
