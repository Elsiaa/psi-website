#!/usr/bin/env python3
"""Anti-AI-slop audit: scans a static site copy for hallmarks of AI-generated copy."""
import re, sys, html, collections, os, json
from pathlib import Path

ROOT = Path(sys.argv[1])

CLICHES = [
    "delve", "elevate", "seamless", "seamlessly", "unleash", "unlock", "empower",
    "cutting-edge", "state-of-the-art", "game-changer", "game changing",
    "in today's fast-paced", "look no further", "we take pride", "we pride ourselves",
    "tapestry", "testament to", "vibrant", "meticulous", "meticulously",
    "boasts", "nestled", "elevat", "transformative", "revolutioniz",
    "unparalleled", "unmatched", "world-class", "top-notch", "best-in-class",
    "one-stop shop", "hidden gem", "rich history", "breathtaking", "stunning",
    "whether you're", "whether you are", "dream home", "bring your vision to life",
    "vision to life", "exceed your expectations", "exceeds expectations",
    "attention to detail", "craftsmanship you can trust", "journey",
    "passionate about", "committed to excellence", "dedicated to providing",
    "furthermore", "moreover", "additionally,", "in conclusion",
    "it's important to note", "it is important to note", "dive into", "dive in",
    "robust", "leverage", "synergy", "holistic", "comprehensive solution",
    "fostering", "landscape of", "realm of", "ever-evolving", "navigate the",
]
NOTJUST = re.compile(r"\b(?:it'?s|this is|we'?re|that'?s) not just[^.!?]{0,120}?(?:it'?s|but|—|-|;)", re.I)
EMDASH = "—"
PLACEHOLDER = re.compile(r"lorem ipsum|placeholder|TODO|FIXME|example\.com|your text here|coming soon", re.I)
TAGSTRIP = re.compile(r"<(script|style)[^>]*>.*?</\1>", re.S | re.I)
TAG = re.compile(r"<[^>]+>")

def text_of(p):
    raw = p.read_text(errors="replace")
    t = TAGSTRIP.sub(" ", raw)
    return raw, html.unescape(TAG.sub(" ", t))

pages = sorted(ROOT.rglob("*.html"))
report = {}
paras = collections.defaultdict(list)

for p in pages:
    raw, txt = text_of(p)
    rel = str(p.relative_to(ROOT))
    words = len(txt.split())
    hits = collections.Counter()
    low = txt.lower()
    for c in CLICHES:
        n = low.count(c)
        if n: hits[c] = n
    nj = NOTJUST.findall(txt)
    em = txt.count(EMDASH)
    ph = PLACEHOLDER.findall(raw)
    # missing/empty alt
    imgs = re.findall(r"<img\b[^>]*>", raw, re.I)
    noalt = [i for i in imgs if not re.search(r'alt="[^"]+"', i)]
    genalt = [i for i in imgs if re.search(r'alt="(image|photo|picture|img\d*)"', i, re.I)]
    # emoji
    emoji = re.findall(r"[\U0001F300-\U0001FAFF✨✅❌⭐]", txt)
    # duplicate paragraph detection
    for m in re.finditer(r"<p[^>]*>(.*?)</p>", raw, re.S | re.I):
        t = html.unescape(TAG.sub(" ", m.group(1))).strip()
        t = re.sub(r"\s+", " ", t)
        if len(t) > 60: paras[t].append(rel)
    report[rel] = dict(words=words, cliches=dict(hits), not_just_pattern=len(nj),
                       nj_samples=nj[:3], em_dashes=em,
                       em_per_1k=round(em / words * 1000, 1) if words else 0,
                       placeholders=ph[:5], imgs=len(imgs), missing_alt=len(noalt),
                       generic_alt=len(genalt), emoji=len(emoji))

dupes = {t[:120]: v for t, v in paras.items() if len(set(v)) > 1}
print(json.dumps({"pages": report, "duplicate_paragraphs": dupes}, indent=1))
