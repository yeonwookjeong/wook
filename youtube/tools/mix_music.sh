#!/usr/bin/env bash
# 완성 영상(내레이션·효과음 포함)에 배경음을 깐다. 영상은 다시 렌더링하지 않고 소리만 섞는다.
# 사용: mix_music.sh 영상.mp4 음악.wav 결과.mp4 어두운장면시작초 어두운장면끝초
#   - 배경음은 기본 -39 LUFS (내레이션 약 -23 LUFS보다 16dB쯤 작게, 2026-11-08 대표님 "조금 더 작게")
#   - 마지막에 전체를 쇼츠 표준 크기(-14 LUFS, 최대 -1.5dB)로 올린다
#   - 死(어두운 하늘) 구간에서는 음악이 거의 꺼졌다가 다시 들어온다
#   - 마지막 0.6초는 줄여서 끝낸다 (반복 재생 이음새)
set -euo pipefail
in="$1"; music="$2"; out="$3"; a="$4"; b="$5"; bed="${6:--39}"  # 6번째 값: 배경음 크기(LUFS, 기본 -39)
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
fo=$(python3 -c "print(max(0, $dur - 0.6))")
vol="if(lt(t,$a-0.3),1,if(lt(t,$a),1-0.9*(t-($a-0.3))/0.3,if(lt(t,$b),0.1,if(lt(t,$b+0.4),0.1+0.9*(t-$b)/0.4,1))))"
ffmpeg -v error -y -i "$in" -i "$music" -filter_complex \
  "[1:a]atrim=0:$dur,asetpts=PTS-STARTPTS,aresample=48000,loudnorm=I=$bed:TP=-3:LRA=11,volume='$vol':eval=frame,afade=t=out:st=$fo:d=0.6[m];[0:a]aresample=48000[v];[v][m]amix=inputs=2:normalize=0:duration=first[aout]" \
  -map 0:v -map "[aout]" -c:v copy -c:a pcm_s16le "$out.tmp.mov"
# 전체 크기 맞추기: 재서 모자란 만큼 올리고, 튀는 곳은 리미터로 누른다
cur=$(ffmpeg -nostats -i "$out.tmp.mov" -af loudnorm=print_format=summary -f null - 2>&1 | awk '/Input Integrated/{print $3}')
gain=$(python3 -c "print(-14 - ($cur))")
ffmpeg -v error -y -i "$out.tmp.mov" -af "volume=${gain}dB,alimiter=limit=0.84:level=false" -c:v copy -c:a aac -b:a 192k "$out"
rm -f "$out.tmp.mov"
echo "저장: $out (원래 $cur LUFS → -14 LUFS로)"
