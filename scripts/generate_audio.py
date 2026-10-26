import asyncio
import json
import os
import sys

import edge_tts

VOICE = os.environ.get("EDGE_VOICE", "en-US-AndrewMultilingualNeural")
RATE = os.environ.get("EDGE_RATE", "+3%")
PITCH = os.environ.get("EDGE_PITCH", "-2Hz")
CONCURRENCY = int(os.environ.get("EDGE_CONCURRENCY", "3"))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "audio")


async def generate(item, semaphore):
    target = os.path.join(AUDIO_DIR, f"{item['id']}.mp3")
    if os.path.exists(target) and os.path.getsize(target) > 1000:
        return "cached"
    async with semaphore:
        for attempt in range(3):
            try:
                communicate = edge_tts.Communicate(
                    item["text"], VOICE, rate=RATE, pitch=PITCH
                )
                await communicate.save(target)
                if os.path.getsize(target) > 1000:
                    return "ok"
            except Exception as error:  # noqa: BLE001
                last = error
                await asyncio.sleep(2 + attempt * 2)
        print(f"FAILED {item['id']}: {last}", file=sys.stderr)
        return "failed"


async def main():
    with open(os.path.join(AUDIO_DIR, "items.json"), encoding="utf-8") as handle:
        items = json.load(handle)

    semaphore = asyncio.Semaphore(CONCURRENCY)
    results = []
    for index, item in enumerate(items, 1):
        result = await generate(item, semaphore)
        results.append(result)
        print(f"[{index}/{len(items)}] {item['id']} {result}", flush=True)

    ok = results.count("ok")
    cached = results.count("cached")
    failed = results.count("failed")
    print(f"done: {ok} new, {cached} cached, {failed} failed")
    if failed:
        sys.exit(1)


asyncio.run(main())
