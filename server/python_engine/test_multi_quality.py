import json
import os
import sys
import subprocess
import yt_dlp

def test_download_quality(quality_label, target_height):
    url = 'https://youtu.be/e2kIhlfmOJw?si=5js6Ops_8pYHN87_'
    ffmpeg_path = r'C:\Users\raivi\OneDrive\Desktop\Social\server\node_modules\@ffmpeg-installer\win32-x64\ffmpeg.exe'
    out_file = f'test_output_{quality_label}.mp4'
    
    if os.path.exists(out_file):
        os.remove(out_file)

    # yt-dlp format selector: exact height video + best audio merged into mp4
    format_selector = f'bestvideo[height<={target_height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<={target_height}]+bestaudio/best[height<={target_height}]/best'
    
    ydl_opts = {
        'format': format_selector,
        'outtmpl': out_file,
        'ffmpeg_location': ffmpeg_path,
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
        'postprocessors': [{
            'key': 'FFmpegVideoConvertor',
            'preferedformat': 'mp4'
        }]
    }

    print(f'Starting download for {quality_label} (target height <= {target_height})...')
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    if os.path.exists(out_file):
        size_bytes = os.path.getsize(out_file)
        print(f'SUCCESS! {quality_label} downloaded: {size_bytes} bytes ({size_bytes / 1024 / 1024:.2f} MB)')
        
        # Probe resolution using ffprobe
        ffprobe_path = r'C:\Users\raivi\OneDrive\Desktop\Social\server\node_modules\@ffprobe-installer\win32-x64\ffprobe.exe'
        if os.path.exists(ffprobe_path):
            cmd = [
                ffprobe_path, '-v', 'error',
                '-select_streams', 'v:0',
                '-show_entries', 'stream=width,height,codec_name',
                '-of', 'json', out_file
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                probe_data = json.loads(res.stdout)
                streams = probe_data.get('streams', [])
                if streams:
                    s = streams[0]
                    print(f'PROBE RESULT for {quality_label}: Resolution={s.get("width")}x{s.get("height")}, Codec={s.get("codec_name")}')
        
        # Cleanup
        os.remove(out_file)
    else:
        print(f'FAILED: {out_file} not created')

def main():
    test_download_quality('360p', 360)
    test_download_quality('720p', 720)
    test_download_quality('1080p', 1080)
    test_download_quality('1440p', 1440)

if __name__ == '__main__':
    main()
