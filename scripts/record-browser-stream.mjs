import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

// Record actual agent-browser Chrome frames without the Windows live encoder's
// backpressure bug. Capture timestamps determine playback; no synthetic frames.
const [port, directory] = process.argv.slice(2);
const output = resolve(directory);
mkdirSync(output, { recursive: true });
const frames = [];
let finished = false;
const socket = new WebSocket(`ws://127.0.0.1:${port}/?maxFps=30`);
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type !== "frame") return;
  const file = resolve(output, `${String(frames.length).padStart(6, "0")}.jpg`);
  writeFileSync(file, Buffer.from(message.data, "base64"));
  // An opening stream frame can be cached from an earlier repaint. Bound its
  // timestamp to this capture's lifetime so it cannot create an artificial lead-in.
  const time = frames.length ? message.metadata.timestamp : Date.now();
  frames.push({ file, time });
  writeFileSync(resolve(output, "ready"), "");
});
const timer = setInterval(() => {
  if (!existsSync(resolve(output, "stop"))) return;
  clearInterval(timer);
  finished = true;
  socket.close();
  if (frames.length < 2) {
    writeFileSync(
      resolve(output, "recording.json"),
      JSON.stringify({
        error: "Insufficient captured frames",
        frames: frames.length,
      }),
    );
    return;
  }
  const concat =
    frames
      .map(
        (frame, i) =>
          `file '${frame.file.replaceAll("\\", "/")}'\nduration ${Math.max(0.016, ((frames[i + 1]?.time ?? frame.time + 600) - frame.time) / 1000)}`,
      )
      .join("\n") + `\nfile '${frames.at(-1).file.replaceAll("\\", "/")}'\n`;
  const list = resolve(output, "frames.txt");
  writeFileSync(list, concat);
  const video = resolve(
    output,
    "../",
    `${output.split(/[\\/]/).at(-1).split("-frames-")[0]}.mp4`,
  );
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      "-vf",
      "pad=ceil(iw/2)*2:ceil(ih/2)*2",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-fps_mode",
      "vfr",
      video,
    ],
    { encoding: "utf8", windowsHide: true },
  );
  writeFileSync(
    resolve(output, "recording.json"),
    JSON.stringify({
      frames: frames.length,
      durationMs: frames.at(-1).time - frames[0].time,
      video,
      exitCode: result.status,
      error: result.error?.message ?? result.stderr,
    }),
  );
}, 100);
socket.addEventListener("error", (event) => {
  if (finished) return;
  clearInterval(timer);
  writeFileSync(
    resolve(output, "recording.json"),
    JSON.stringify({ error: String(event.error) }),
  );
});
