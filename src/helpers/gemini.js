import { GoogleGenAI, Type } from '@google/genai';
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import path from "node:path";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { supabase } from '../models/db.js';
import { Readable } from "node:stream";
import os from "node:os";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function geminiAnalysis(videoPath) {
    const prompt =
    `You are an expert gym personal coach specializing in improving the quality of people’s workouts. You are given a video of me working out. Do the following:
    
    1. Determine the exercise being done
    2. Analyze my form and technique for each repetition
    2a. For each observation, note the timestamp and suggestions you recommend to improve the workout. The timestamp should line up with the video frame at the begining of the observation.
    2b. Keep suggestions short, concise, and straightforward yet detailed enough to help me improve my form and technique.
    2c. Space suggestions out evenly so that they are not too close together.
    3. Output your response strictly in JSON in this format:
    {
      "exercise": "Incline Bench Press",
      "analysis": [
        {
          "timestamp": "00:01",
          "suggestion": "Maintain this controlled descent in all your reps. Consider tucking your elbows in slightly (to about a 45-60 degree angle from your torso) to increase lat engagement and potentially reduce shoulder strain."
        }
      ]
    }`;
  
    const { data: signed, error: signErr } = await supabase
    .storage
    .from("raw_workouts")
    .createSignedUrl(videoPath, 60 * 5);

  if (signErr) throw new Error(`Signed URL error: ${signErr.message}`);

  // 2) Stream the signed URL to a temp file (no full in-memory buffering)
  const resp = await fetch(signed.signedUrl);
  if (!resp.ok || !resp.body) {
    throw new Error(`Failed to fetch storage object: ${resp.status} ${resp.statusText}`);
  }

  const mimeType = resp.headers.get("content-type") || "video/mp4";
  const tmpPath = path.join(
    os.tmpdir(),
    `workout-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
  );

  await pipeline(Readable.fromWeb(resp.body), createWriteStream(tmpPath));

  try {
    // 3) Upload the *file path* to Gemini Files API (SDK can stat() size)
    const file = await ai.files.upload({
      file: tmpPath,
      config: {
        mimeType,
        displayName: videoPath.split("/").pop() || "workout.mp4",
      },
    });

    const f = file.file ?? file;
    await waitForFileActive({ name: f.name });

    // 4) Ask the model using the uploaded file
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { fileData: { fileUri: file.uri, mimeType } },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

    // Return the model’s text (or JSON.parse if you set responseMimeType)
    console.log(result.text);
    const parsed = JSON.parse(result.text);

    // Delete the original raw video after successful analysis
    const { error: delErr } = await supabase
      .storage
      .from("raw_workouts")
      .remove([videoPath]);
    if (delErr) {
      console.warn(`Failed to delete raw_workouts/${videoPath}: ${delErr.message}`);
    }

    return parsed; // note: it's `text` (no parentheses)
  } finally {
    // 5) Clean up the temp file
    await fs.unlink(tmpPath).catch(() => {});
  }
}

export async function overlayAnalysis(videoPath, analysis, width, height) {
  // 1) Signed URL for input video
  const { data: signed, error: signErr } = await supabase
    .storage
    .from("raw_workouts")
    .createSignedUrl(videoPath, 60 * 10);
  if (signErr) throw new Error(`Signed URL error: ${signErr.message}`);

  // Normalize analysis to object
  let analysisObj = analysis;
  if (typeof analysisObj === "string") {
    try { analysisObj = JSON.parse(analysisObj); } catch { throw new Error("overlayAnalysis: analysis is not valid JSON"); }
  }
  const items = (analysisObj && analysisObj.analysis) || [];
  if (!items.length) throw new Error("overlayAnalysis: no analysis items provided.");

  // Probe video dimensions if not provided
  if (!width || !height) {
    const probed = await probeVideoDimensions(signed.signedUrl);
    if (probed?.width && probed?.height) {
      width = probed.width;
      height = probed.height;
    } else {
      // safe fallback
      width = width || 1920;
      height = height || 1080;
    }
  }

  // Derive relative style values to keep text inside frame
  const fontSize = Math.max(20, Math.round(height * 0.035));
  const marginL = Math.max(40, Math.round(width * 0.06));
  const marginR = marginL;
  const marginV = Math.max(40, Math.round(height * 0.08));

  // 2) Build ASS subtitle file (auto-wrap within margins)
  const assHeader = `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${width}
PlayResY: ${height}

[V4+ Styles]
; Name,       Fontname,      Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour,  Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle, BorderStyle, Outline, Shadow, Alignment, MarginL,MarginR,MarginV, Encoding
Style: Suggestion, DejaVu Sans, ${fontSize},      &H00FFFFFF,   &H000000FF,     &HAA000000,    &H00000000, 0,   0,     0,        0,        100,   100,    0,      0,    1,          3,       1,      2,         ${marginL},    ${marginR},    ${marginV},     0

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;

  const assLines = items.map((a, i) => {
    const startTs = a.timestamp;
    const endTs = i < items.length - 1 ? items[i + 1].timestamp : tsAddSeconds(a.timestamp, 4);
    const start = tsToHMS(startTs);
    const end = tsToHMS(endTs);
    const txt = assEsc(a.suggestion);
    return `Dialogue: 0,${start},${end},Suggestion,,0,0,0,,${txt}`;
  });

  const assContent = `${assHeader}\n${assLines.join("\n")}\n`;
  const tmpAss = path.join(os.tmpdir(), `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}.ass`);
  await fs.writeFile(tmpAss, assContent, "utf8");

  // 3) FFmpeg: burn subtitles; produce analyzed mp4
  const baseName = path.basename(videoPath).replace(/\.[^.]+$/, "");
  const outKey = `${path.dirname(videoPath)}/${baseName}-analyzed.mp4`.replace(/^\.$/, `${baseName}-analyzed.mp4`);
  const tmpOut = path.join(process.cwd(), `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);

  const vf = `subtitles=${tmpAss.replace(/\\/g, "/").replace(/:/g, "\\:")}`;

  const args = [
    "-hide_banner", "-y",
    "-i", signed.signedUrl,
    "-vf", vf,
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-crf", "23",
    "-pix_fmt", "yuv420p",
    "-c:a", "copy",
    "-movflags", "+faststart",
    tmpOut
  ];

  await new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, args, { stdio: "inherit" });
    ff.on("error", reject);
    ff.on("close", code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
  });

  // 4) Upload to analyzed_workouts
  const fileBuf = await fs.readFile(tmpOut);
  const { error: upErr } = await supabase
    .storage
    .from("analyzed_workouts")
    .upload(outKey, fileBuf, { contentType: "video/mp4", upsert: true });

  await Promise.all([
    fs.unlink(tmpOut).catch(() => {}),
    fs.unlink(tmpAss).catch(() => {}),
  ]);

  if (upErr) throw new Error(`Upload error: ${upErr.message}`);

  return outKey;
}

async function waitForFileActive(name, { timeoutMs = 180_000, pollMs = 1500 } = {}) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const f = await ai.files.get(name);      // fetch latest file metadata
      if (f.state === "ACTIVE") return f;      // ready to use
      if (f.state === "FAILED" || f.state === "DELETED") {
        throw new Error(`File state ${f.state}: ${f.error?.message || "no details"}`);
      }
      await new Promise(r => setTimeout(r, pollMs));
    }
    throw new Error("Timed out waiting for file to become ACTIVE");
}

const schema = {
    type: Type.OBJECT,
    properties: {
      exercise: { type: Type.STRING },
      analysis: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp:  { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
          required: ["timestamp", "suggestion"],
          // optional but helps keep fields in a predictable order:
          propertyOrdering: ["timestamp", "suggestion"],
        },
      },
    },
    required: ["exercise", "analysis"],
    propertyOrdering: ["exercise", "analysis"],
};

function tsToSec(ts) {
    const [m, s] = ts.split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
}

function escText(s) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/,/g, "\\,")         // <-- add this
    .replace(/\n/g, "\\n");
}

function tsToHMS(ts) {
    const [m, s] = ts.split(":").map((x) => parseInt(x || "0", 10));
    const total = (m || 0) * 60 + (s || 0);
    const hh = String(Math.floor(total / 3600)).padStart(2, "0");
    const mm = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const ss = String(total % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}.00`;
  }
  
  function assEsc(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\r?\n/g, "\\N");
  }

// Extract width/height from ffmpeg probe (parse stderr)
async function probeVideoDimensions(url) {
  return new Promise((resolve) => {
    const args = [
      "-hide_banner",
      "-i", url,
      "-f", "null",
      "-", // decode but discard, we only need stream info printed
    ];
    const ff = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    ff.stderr.on("data", (d) => { stderr += String(d); });
    ff.on("close", () => {
      // look for e.g. Video: h264 ..., 576x1024 ...
      const m = stderr.match(/Video: [^,]+, [^,]*,\s*(\d+)x(\d+)/);
      const width = m ? parseInt(m[1], 10) : undefined;
      const height = m ? parseInt(m[2], 10) : undefined;
      resolve({ width, height });
    });
    ff.on("error", () => resolve({}));
  });
}

function tsAddSeconds(ts, add) {
  const [m, s] = String(ts || "0:00").split(":").map((x) => parseInt(x || "0", 10));
  let total = (m || 0) * 60 + (s || 0) + (add || 0);
  if (Number.isNaN(total)) total = 0;
  if (total < 0) total = 0;
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}