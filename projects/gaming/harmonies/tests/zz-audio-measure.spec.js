import { test } from "@playwright/test";

test("webkit strictness probes", async ({ page }) => {
  await page.goto("/index.html");
  const out = await page.evaluate(async () => {
    const res = {};
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    await new Promise((r) => setTimeout(r, 120));
    res.state = ctx.state;
    res.currentTime = +ctx.currentTime.toFixed(4);
    res.maxChannelCount = ctx.destination.maxChannelCount;
    res.channelCount = ctx.destination.channelCount;
    res.hasAudioSession = !!navigator.audioSession;
    res.audioSessionType = navigator.audioSession ? navigator.audioSession.type : null;
    // start(0) when currentTime > 0
    try { const s = ctx.createBufferSource(); s.buffer = ctx.createBuffer(1,1,ctx.sampleRate); s.connect(ctx.destination); s.start(0); res.start0 = "ok"; }
    catch (e) { res.start0 = e.name + ": " + e.message; }
    // setValueAtTime at a time already in the past (but positive)
    try { const g = ctx.createGain(); g.gain.setValueAtTime(0.5, Math.max(ctx.currentTime - 0.05, 0)); res.pastSetValue = "ok"; }
    catch (e) { res.pastSetValue = e.name + ": " + e.message; }
    // exponentialRamp target 0
    try { const g = ctx.createGain(); g.gain.setValueAtTime(0.5, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0, ctx.currentTime + 0.1); res.expZero = "ok"; }
    catch (e) { res.expZero = e.name + ": " + e.message; }
    return res;
  });
  console.log(JSON.stringify(out, null, 1));
});
