import sounddevice as sd
import numpy as np
import soundfile as sf
import time
from collections import deque
import sys

SAMPLE_RATE = 44100
BLOCK_SIZE = 1024
THRESHOLD = 0.01        # 소리 감지 기준
SAVE_WAV = True         # 소리 감지 시 WAV 파일로 저장
BUFFER_SECOND = 5       # 이벤트 전 저장할 오디오 길이 (초)
COOLDOWN_SECOND = 5     # 저장 최소 간격 길이 (초)
MIN_ACTIVE_BLOCKS = 10  # 소리 지속 조건


buffer = deque(maxlen=int(SAMPLE_RATE / BLOCK_SIZE * BUFFER_SECOND))
active_count = 0
last_saved_time = 0

# 마이크 존재 확인
def mic_exists_check():
    devices = sd.query_devices()
    for d in devices:
        if d['max_input_channels'] > 0:
            return True
    return False

# 오디오 RMS 계산
def rms(audio):
    return np.sqrt(np.mean(audio**2))

# 오디오 콜백
def callback(indata, frames, time_info, status):
    global active_count, last_saved_time

    if status:
        print(status)

    audio = indata[:, 0]
    buffer.append(audio.copy())

    energy = rms(audio)

    # 소리 없으면 아무것도 안 함
    if energy < THRESHOLD:
        return
    
    # 소리 지속 카운트
    active_count += 1

    if active_count < MIN_ACTIVE_BLOCKS:
        return
    
    now = time.time()

    # 쿨타임 중이면 저장 안 함
    if now - last_saved_time < COOLDOWN_SECOND:
        return

    last_saved_time = now
    active_count = 0

    timestamp = time.strftime("%Y%m%d_%H%M%S")
    print(f"(소리 탐지됨) RMS: {energy:.4f}")

    if SAVE_WAV:
        filename = f"event_{timestamp}.wav"
        sf.write(filename, np.concatenate(buffer), SAMPLE_RATE)
        print(f"오디오 저장됨: {filename}")

# 메인 실행
def main():
    if not mic_exists_check():
        print("마이크를 찾을 수 없습니다.")
        sys.exit(1)
    
    print("마이크 연결됨. 소리 탐지 시작...(종료하려면 Ctrl+C)")

    stream = sd.InputStream(
        samplerate=SAMPLE_RATE,
        blocksize=BLOCK_SIZE,
        channels=1,
        callback=callback
    )
       
    stream.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("종료")
        stream.stop()
        stream.close()

if __name__ == "__main__":
    main()
