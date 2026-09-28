/**
 * POLAR-X AFSK 1200 / Bell 202 Tone Encoder
 * Generates continuous-phase audio frequency shift keying tones (1200 Hz Mark / 2200 Hz Space).
 */

export const AFSK_SAMPLE_RATE = 44100;
export const AFSK_BAUD_RATE = 1200;
export const AFSK_MARK_FREQ = 1200;   // 1200 Hz represents Binary 1
export const AFSK_SPACE_FREQ = 2200;  // 2200 Hz represents Binary 0

export class AfskEncoder {
  /**
   * Convert raw string or hex telegram into continuous-phase Bell 202 audio buffer
   */
  public encodeToAudioBuffer(
    audioCtx: AudioContext,
    rawPayload: string
  ): { buffer: AudioBuffer; durationSeconds: number } {
    // Convert string payload into bit stream with preamble (0x7E flags) and postamble
    const bits: number[] = [];

    // Preamble: 16 alternating bits for receiver synchronization
    for (let i = 0; i < 16; i++) {
      bits.push(i % 2);
    }

    // Convert chars to 8-bit bytes with start bit (0) and stop bit (1)
    for (let i = 0; i < rawPayload.length; i++) {
      const byteVal = rawPayload.charCodeAt(i);
      bits.push(0); // Start bit (Space)
      for (let b = 0; b < 8; b++) {
        bits.push((byteVal >> b) & 1); // LSB first
      }
      bits.push(1); // Stop bit (Mark)
      bits.push(1);
    }

    // Postamble
    for (let i = 0; i < 8; i++) {
      bits.push(1);
    }

    const samplesPerBit = Math.floor(AFSK_SAMPLE_RATE / AFSK_BAUD_RATE);
    const totalSamples = bits.length * samplesPerBit;
    const audioBuffer = audioCtx.createBuffer(1, totalSamples, AFSK_SAMPLE_RATE);
    const channelData = audioBuffer.getChannelData(0);

    let phase = 0;
    let sampleIndex = 0;

    for (const bit of bits) {
      const freq = bit === 1 ? AFSK_MARK_FREQ : AFSK_SPACE_FREQ;
      const phaseIncrement = (2 * Math.PI * freq) / AFSK_SAMPLE_RATE;

      for (let s = 0; s < samplesPerBit; s++) {
        channelData[sampleIndex++] = Math.sin(phase) * 0.75; // 75% audio amplitude
        phase += phaseIncrement;
        if (phase > 2 * Math.PI) {
          phase -= 2 * Math.PI;
        }
      }
    }

    return {
      buffer: audioBuffer,
      durationSeconds: totalSamples / AFSK_SAMPLE_RATE
    };
  }
}

export const afskEncoder = new AfskEncoder();
