"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio, type VoiceTranscriptionResult } from "@/lib/api";

export type RecorderState = "idle" | "requesting" | "recording" | "transcribing";

const MIN_RECORDING_MS = 400;
const MAX_RECORDING_MS = 90_000;

const CANDIDATE_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

export function useVoiceRecorder(
  onResult: (result: VoiceTranscriptionResult) => void,
) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onResultRef = useRef(onResult);
  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const discardRef = useRef(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef(0);
  const stopRef = useRef<() => void>(() => {});

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const release = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (ctxRef.current) {
      void ctxRef.current.close();
      ctxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
  }, []);

  const attachMeter = useCallback((stream: MediaStream) => {
    let ctx: AudioContext;
    try {
      ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let lastPush = 0;

      ctxRef.current = ctx;

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i += 1) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const now = performance.now();
        if (now - lastPush > 55) {
          lastPush = now;
          setLevel(Math.min(1, rms * 3.2));
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch {
      return;
    }
  }, []);

  const start = useCallback(async () => {
    if (activeRef.current) return;
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setError("This browser can't record audio.");
      return;
    }

    activeRef.current = true;
    discardRef.current = false;
    setError(null);
    setDuration(0);
    setState("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      activeRef.current = false;
      setState("idle");
      setError(
        "Microphone access was blocked. Allow it in your browser, then try again.",
      );
      return;
    }

    if (!mountedRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }

    streamRef.current = stream;
    chunksRef.current = [];

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      const elapsed = Date.now() - startedAtRef.current;
      const discarded = discardRef.current;
      const tooShort = elapsed < MIN_RECORDING_MS || blob.size === 0;

      release();
      setLevel(0);
      setDuration(0);

      if (discarded || tooShort) {
        activeRef.current = false;
        setState("idle");
        return;
      }

      setState("transcribing");
      transcribeAudio(
        blob,
        type.includes("mp4") ? "recording.mp4" : "recording.webm",
      )
        .then((result) => {
          if (!mountedRef.current) return;
          if (result.refinedPrompt) onResultRef.current(result);
          else setError("Didn't catch that — try again, a bit closer to the mic.");
        })
        .catch((e: unknown) => {
          if (!mountedRef.current) return;
          setError(e instanceof Error ? e.message : "Transcription failed.");
        })
        .finally(() => {
          if (!mountedRef.current) return;
          activeRef.current = false;
          setState("idle");
        });
    };

    startedAtRef.current = Date.now();
    recorder.start(100);
    setState("recording");

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setDuration(elapsed / 1000);
      if (elapsed >= MAX_RECORDING_MS) stopRef.current();
    }, 100);

    attachMeter(stream);
  }, [attachMeter, release]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }, []);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    discardRef.current = true;
    if (!recorder || recorder.state === "inactive") {
      activeRef.current = false;
      setState("idle");
      release();
      return;
    }
    recorder.stop();
  }, [release]);

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardRef.current = true;
      activeRef.current = false;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      release();
    };
  }, [release]);

  return { state, duration, level, error, start, stop, cancel };
}
