"""Extract figure images from the storybook HTML, or replace one figure's image and alt.

Usage:
  extract.py extract <html> <pN> <out.jpg>
  extract.py replace <html> <pN> <new.jpg> <old_alt_fragment> <new_alt_fragment>
"""
import base64
import re
import sys


def figure_span(html: str, pid: str):
    start = html.index(f'<figure id="{pid}">')
    end = html.index("</figure>", start) + len("</figure>")
    return start, end


def main() -> None:
    cmd, path, pid = sys.argv[1:4]
    with open(path, encoding="utf-8") as f:
        html = f.read()
    s, e = figure_span(html, pid)
    fig = html[s:e]
    m = re.search(r'src="data:image/jpeg;base64,([A-Za-z0-9+/=]+)"', fig)
    assert m, "no jpeg data uri in figure"
    if cmd == "extract":
        out = sys.argv[4]
        with open(out, "wb") as f:
            f.write(base64.b64decode(m.group(1)))
        print(f"wrote {out} ({len(m.group(1))} b64 chars)")
    elif cmd == "replace":
        new_jpg, old_alt, new_alt = sys.argv[4:7]
        with open(new_jpg, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        new_fig = fig[: m.start(1)] + b64 + fig[m.end(1):]
        assert new_fig.count(old_alt) == 1, f"alt fragment count: {new_fig.count(old_alt)}"
        new_fig = new_fig.replace(old_alt, new_alt)
        html = html[:s] + new_fig + html[e:]
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"replaced {pid}: {len(m.group(1))} -> {len(b64)} b64 chars; alt updated")
    else:
        raise SystemExit("unknown cmd")


if __name__ == "__main__":
    main()
