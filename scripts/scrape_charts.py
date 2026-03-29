from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import requests
from bs4 import BeautifulSoup

OUT_FILE = Path("data/charts.json")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    )
}


@dataclass
class ChartSource:
    chart_id: str
    name: str
    url: str
    kind: str
    platform: str


SOURCES = [
    ChartSource(
        chart_id="spotify-global-daily",
        name="Global Daily",
        url="https://kworb.net/spotify/country/global_daily.html",
        kind="kworb_spotify",
        platform="Spotify",
    ),
    ChartSource(
        chart_id="spotify-global-weekly",
        name="Global Weekly",
        url="https://kworb.net/spotify/country/global_weekly.html",
        kind="kworb_spotify",
        platform="Spotify",
    ),
    ChartSource(
        chart_id="apple-us-most-played",
        name="US Top Songs",
        url="https://rss.applemarketingtools.com/api/v2/us/music/most-played/50/songs.json",
        kind="apple_rss",
        platform="Apple Music",
    ),
    ChartSource(
        chart_id="apple-tr-most-played",
        name="TR Top Songs",
        url="https://rss.applemarketingtools.com/api/v2/tr/music/most-played/50/songs.json",
        kind="apple_rss",
        platform="Apple Music",
    ),
    ChartSource(
        chart_id="deezer-global-top",
        name="Global Top Tracks",
        url="https://api.deezer.com/chart/0/tracks?limit=50",
        kind="deezer_api",
        platform="Deezer",
    ),
]


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def find_first_table(soup: BeautifulSoup):
    table = soup.select_one("table")
    if table is None:
        raise RuntimeError("Tablo bulunamadi")
    return table


def parse_kworb_rows(table, limit: int = 10) -> Iterable[dict]:
    rows = []
    for tr in table.select("tr"):
        cells = tr.find_all(["td", "th"])
        if len(cells) < 3:
            continue

        rank_match = re.search(r"\d+", clean_text(cells[0].get_text(" ", strip=True)))
        if not rank_match:
            continue

        rank = int(rank_match.group(0))
        artist_title = clean_text(cells[2].get_text(" ", strip=True))
        if " - " in artist_title:
            artist, title = artist_title.split(" - ", 1)
            artist = clean_text(artist)
            title = clean_text(title)
        else:
            artist = "Bilinmeyen Sanatci"
            title = artist_title

        if not title or not artist:
            continue

        rows.append({"rank": rank, "title": title, "artist": artist})
        if len(rows) >= limit:
            break

    if not rows:
        raise RuntimeError("Satirlar parse edilemedi")

    return rows


def scrape_kworb(source: ChartSource, limit: int = 10) -> dict:
    response = requests.get(source.url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    response.encoding = "utf-8"

    soup = BeautifulSoup(response.text, "html.parser")
    table = find_first_table(soup)
    entries = list(parse_kworb_rows(table, limit=limit))

    return {
        "id": source.chart_id,
        "name": source.name,
        "platform": source.platform,
        "source": source.url,
        "entries": entries,
    }


def scrape_apple_rss(source: ChartSource, limit: int = 10) -> dict:
    response = requests.get(source.url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    payload = json.loads(response.content.decode("utf-8"))
    feed = payload.get("feed", {})
    results = feed.get("results", [])

    entries = []
    for idx, item in enumerate(results[:limit], start=1):
        title = clean_text(item.get("name", ""))
        artist = clean_text(item.get("artistName", ""))
        if not title or not artist:
            continue
        entries.append({"rank": idx, "title": title, "artist": artist})

    if not entries:
        raise RuntimeError("Apple RSS verisi parse edilemedi")

    return {
        "id": source.chart_id,
        "name": source.name,
        "platform": source.platform,
        "source": source.url,
        "entries": entries,
    }


def scrape_deezer(source: ChartSource, limit: int = 10) -> dict:
    response = requests.get(source.url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    payload = json.loads(response.content.decode("utf-8"))
    tracks = payload.get("data", [])

    entries = []
    for idx, item in enumerate(tracks[:limit], start=1):
        title = clean_text(item.get("title", ""))
        artist = clean_text((item.get("artist") or {}).get("name", ""))
        if not title or not artist:
            continue
        entries.append({"rank": idx, "title": title, "artist": artist})

    if not entries:
        raise RuntimeError("Deezer verisi parse edilemedi")

    return {
        "id": source.chart_id,
        "name": source.name,
        "platform": source.platform,
        "source": source.url,
        "entries": entries,
    }


def scrape_source(source: ChartSource) -> dict:
    if source.kind == "kworb_spotify":
        return scrape_kworb(source, limit=10)
    if source.kind == "apple_rss":
        return scrape_apple_rss(source, limit=10)
    if source.kind == "deezer_api":
        return scrape_deezer(source, limit=10)

    raise RuntimeError(f"Desteklenmeyen source kind: {source.kind}")


def main() -> None:
    charts = []
    for source in SOURCES:
        try:
            charts.append(scrape_source(source))
            print(f"OK: {source.platform} - {source.name}")
        except Exception as exc:
            print(f"FAIL: {source.platform} - {source.name} -> {exc}")

    if not charts:
        raise SystemExit("Hic chart uretilemedi")

    payload = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "charts": charts,
    }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Yazildi: {OUT_FILE}")


if __name__ == "__main__":
    main()
